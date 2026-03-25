import { streamText } from "ai";
import { Groq } from "groq-sdk";
import { Message } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { retrieveRelevantChunks, formatRetrievedContext } from "./rag";
import {
  selectMemoryMessages,
  buildSystemPrompt,
  buildMessages,
  estimateChatTokens,
} from "./prompt";
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

export async function chatWithContext(
  sessionId: string,
  userMessage: string,
  lessonMaterial: string,
  config: ChatConfig = {},
) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { messages: true },
  });

  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const contextMessages = selectMemoryMessages(
    session.messages.map((msg: Message) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
      timestamp: msg.createdAt,
    })),
    {
      maxMessages: config.maxContextMessages,
      maxTokens: config.maxContextTokens,
    },
  );

  let ragContext = "";
  if (config.useRag !== false) {
    const retrievals = await retrieveRelevantChunks(
      userMessage,
      session.userId,
      session.lessonId,
    );
    ragContext = formatRetrievedContext(retrievals);
  }

  const systemPrompt = buildSystemPrompt(
    lessonMaterial,
    ragContext,
    config.customSystemPrompt,
  );

  const messages = buildMessages(userMessage, contextMessages, systemPrompt);

  estimateChatTokens(systemPrompt, contextMessages, userMessage);

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: messages,
    stream: true,
  });

  const encoder = new TextEncoder();
  let fullText = "";

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of completion) {
        const text = chunk.choices?.[0]?.delta?.content || "";
        fullText += text;
        controller.enqueue(encoder.encode(text));
      }

      controller.close();

      // Save messages after stream ends
      await prisma.message.create({
        data: {
          sessionId,
          role: "user",
          content: userMessage,
        },
      });

      await prisma.message.create({
        data: {
          sessionId,
          role: "assistant",
          content: fullText,
        },
      });
    },
  });

  return {
    stream,
    onFinish: async () => {},
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
