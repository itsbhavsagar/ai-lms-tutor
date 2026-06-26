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
import { estimateTokenCount } from "@/lib/utils/text";

export interface ChatConfig {
  maxContextMessages?: number;
  maxContextTokens?: number;
  useRag?: boolean;
  customSystemPrompt?: string;
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

export async function chatWithContext(
  sessionId: string,
  userMessage: string,
  lesson: Lesson,
  profile: LearnerProfile,
  config: ChatConfig = {},
) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { messages: true },
  });

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

  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          stream: true,
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
      } catch (error) {
        console.error("Streaming error:", error);
        controller.error(error);
      }
    },
  });

  return {
    stream,
    onFinish: async () => {
      // Saved when the stream completes.
    },
  };
}

export async function getSessionMessages(sessionId: string) {
  const messages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  return messages;
}

export async function createChatSession(
  userId: string,
  lessonId: string,
  title?: string,
) {
  return prisma.session.create({
    data: {
      userId,
      lessonId,
      title: title || "New Chat",
    },
  });
}

export async function listUserSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { messages: true },
  });
}

export async function deleteSession(sessionId: string) {
  return prisma.session.delete({
    where: { id: sessionId },
  });
}
