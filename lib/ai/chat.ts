import { Groq } from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { Message } from "@prisma/client";
import {
  buildMentorTurnPlan,
  formatMentorTurnPlan,
} from "@/lib/ai/mentor-engine";
import { buildLearnSystemPrompt } from "@/lib/ai/prompts/learn";
import type { LearnerProfile } from "@/lib/db/learner-profile";
import type { Lesson } from "@/lib/curriculum/types";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseConnectionError } from "@/lib/db/db-error";
import { estimateTokenCount } from "@/lib/utils/text";

export type ClientChatMessage = {
  role: "user" | "assistant";
  content: string;
};

interface ChatConfig {
  maxContextMessages?: number;
  maxContextTokens?: number;
  useRag?: boolean;
  customSystemPrompt?: string;
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const LEARN_MAX_TOKENS = 300;
const LEARN_TEMPERATURE = 0.5;

function selectMemoryMessages(
  messages: Message[],
  config: { maxMessages?: number; maxTokens?: number } = {},
): Message[] {
  const maxMessages = config.maxMessages || 10;
  const maxTokens = config.maxTokens || 4000;

  if (messages.length === 0) return [];

  const recent = messages.slice(-maxMessages);

  let totalTokens = 0;
  const selected: Message[] = [];

  for (const msg of recent.reverse()) {
    const tokens = estimateTokenCount(msg.content);
    if (totalTokens + tokens > maxTokens) break;
    selected.unshift(msg);
    totalTokens += tokens;
  }

  return selected;
}

function buildSystemPrompt(
  lesson: Lesson,
  profile: LearnerProfile,
  priorUserMessages: string[],
  priorAssistantMessages: string[],
  userMessage: string,
): string {
  const turnPlan = buildMentorTurnPlan(
    priorUserMessages,
    priorAssistantMessages,
    userMessage,
    lesson,
    profile,
  );
  const turnPlanBlock = formatMentorTurnPlan(turnPlan, lesson);
  return buildLearnSystemPrompt(lesson, profile, turnPlanBlock);
}

function buildMessages(
  systemPrompt: string,
  contextMessages: Message[],
  userMessage: string,
): ChatCompletionMessageParam[] {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
  ];

  for (const msg of contextMessages) {
    messages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: userMessage });

  return messages;
}

function toMemoryMessages(messages: ClientChatMessage[]): Message[] {
  return messages.map((m, i) => ({
    id: `client-${i}`,
    sessionId: "client",
    role: m.role,
    content: m.content,
    createdAt: new Date(),
  }));
}

function splitClientHistory(
  clientMessages: ClientChatMessage[],
  userMessage: string,
): ClientChatMessage[] {
  if (clientMessages.length === 0) return [];

  const last = clientMessages[clientMessages.length - 1];
  if (last.role === "user" && last.content === userMessage) {
    return clientMessages.slice(0, -1);
  }

  return clientMessages;
}

function createGroqStream(
  groqMessages: ChatCompletionMessageParam[],
  onComplete?: (fullResponse: string) => Promise<void>,
) {
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let fullResponse = "";

      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          stream: true,
          temperature: LEARN_TEMPERATURE,
          max_tokens: LEARN_MAX_TOKENS,
          messages: groqMessages,
        });

        for await (const chunk of completion) {
          const text = chunk.choices?.[0]?.delta?.content || "";
          if (text) {
            fullResponse += text;
            controller.enqueue(encoder.encode(text));
          }
        }

        controller.close();

        if (onComplete && fullResponse) {
          try {
            await onComplete(fullResponse);
          } catch (error) {
            console.error("[Chat] Post-stream persistence failed:", error);
          }
        }
      } catch (error) {
        console.error("Streaming error:", error);
        controller.error(error);
      }
    },
  });
}

export async function chatWithoutDatabase(
  userMessage: string,
  clientMessages: ClientChatMessage[],
  lesson: Lesson,
  profile: LearnerProfile,
  config: ChatConfig = {},
) {
  const history = splitClientHistory(clientMessages, userMessage);
  const memoryMessages = toMemoryMessages(history);

  const priorUserMessages = history
    .filter((m) => m.role === "user")
    .map((m) => m.content);
  const priorAssistantMessages = history
    .filter((m) => m.role === "assistant")
    .map((m) => m.content);

  const contextMessages = selectMemoryMessages(memoryMessages, {
    maxMessages: config.maxContextMessages,
    maxTokens: config.maxContextTokens,
  });

  const systemPrompt =
    config.customSystemPrompt ??
    buildSystemPrompt(
      lesson,
      profile,
      priorUserMessages,
      priorAssistantMessages,
      userMessage,
    );

  const groqMessages = buildMessages(systemPrompt, contextMessages, userMessage);

  return {
    stream: createGroqStream(groqMessages),
    onFinish: async () => {},
  };
}

export async function chatWithContext(
  sessionId: string,
  userMessage: string,
  lesson: Lesson,
  profile: LearnerProfile,
  config: ChatConfig = {},
  clientMessages: ClientChatMessage[] = [],
) {
  let session;
  try {
    session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { messages: true },
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      console.error("[Chat] DB unavailable, using stateless mode:", error);
      return chatWithoutDatabase(
        userMessage,
        clientMessages,
        lesson,
        profile,
        config,
      );
    }
    throw error;
  }

  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const contextMessages = selectMemoryMessages(session.messages, {
    maxMessages: config.maxContextMessages,
    maxTokens: config.maxContextTokens,
  });

  const priorUserMessages = session.messages
    .filter((m) => m.role === "user")
    .map((m) => m.content);

  const priorAssistantMessages = session.messages
    .filter((m) => m.role === "assistant")
    .map((m) => m.content);

  const systemPrompt =
    config.customSystemPrompt ??
    buildSystemPrompt(
      lesson,
      profile,
      priorUserMessages,
      priorAssistantMessages,
      userMessage,
    );
  const groqMessages = buildMessages(systemPrompt, contextMessages, userMessage);

  try {
    await prisma.message.create({
      data: {
        sessionId,
        role: "user",
        content: userMessage,
      },
    });

    await prisma.session.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      console.error("[Chat] DB write failed, streaming without persistence:", error);
      return chatWithoutDatabase(
        userMessage,
        clientMessages,
        lesson,
        profile,
        config,
      );
    }
    throw error;
  }

  return {
    stream: createGroqStream(groqMessages, async (fullResponse) => {
      await prisma.message.create({
        data: {
          sessionId,
          role: "assistant",
          content: fullResponse,
        },
      });

      await prisma.session.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });
    }),
    onFinish: async () => {},
  };
}
