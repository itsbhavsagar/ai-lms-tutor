import { streamText } from "ai";
import { Groq } from "groq-sdk";
import { Message } from "@prisma/client";
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

function buildSystemPrompt(lessonMaterial: string, useRag: boolean): string {
  if (useRag) {
    return `You are a helpful tutor. Use the provided lesson material to answer questions accurately.

Lesson Material:
${lessonMaterial}

Answer based on this material when relevant.`;
  }

  return `You are a helpful tutor. Answer questions about the lesson material provided.

Lesson Material:
${lessonMaterial}`;
}

function buildMessages(
  systemPrompt: string,
  contextMessages: Message[],
  userMessage: string,
): any[] {
  const messages = [{ role: "system", content: systemPrompt }];

  for (const msg of contextMessages) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: userMessage });

  return messages;
}

function estimateChatTokens(messages: any[]): number {
  return messages.reduce(
    (sum, msg) => sum + estimateTokenCount(msg.content),
    0,
  );
}

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

  const contextMessages = selectMemoryMessages(session.messages, {
    maxMessages: config.maxContextMessages,
    maxTokens: config.maxContextTokens,
  });

  const systemPrompt = buildSystemPrompt(
    lessonMaterial,
    config.useRag || false,
  );
  const messages = buildMessages(systemPrompt, contextMessages, userMessage);

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    stream: true,
    messages,
  });

  await prisma.message.create({
    data: {
      sessionId,
      role: "user",
      content: userMessage,
    },
  });

  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
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
      } catch (error) {
        console.error("Streaming error:", error);
        controller.error(error);
      }
    },
  });

  return {
    stream,
    onFinish: async () => {
      // Already saved in stream
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
