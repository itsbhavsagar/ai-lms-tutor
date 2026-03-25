/**
 * Prompt Construction & Memory Management
 * Builds system and conversation prompts with context injection
 */

import { ChatMessage } from "@/lib/db/schema";
import { estimateTokenCount, truncateToTokenBudget } from "@/lib/utils/text";

/**
 * Memory configuration
 */
export interface MemoryConfig {
  maxMessages?: number; // Max number of previous messages to include
  maxTokens?: number; // Max tokens for conversation history
}

const DEFAULT_MEMORY: Required<MemoryConfig> = {
  maxMessages: 10,
  maxTokens: 4000, // Reasonable for most models
};

/**
 * Select relevant messages to include in context
 * Balances recency with token budget
 */
export function selectMemoryMessages(
  messages: ChatMessage[],
  config: MemoryConfig = {},
): ChatMessage[] {
  const finalConfig = { ...DEFAULT_MEMORY, ...config };

  if (messages.length === 0) return [];

  // 1. Take only most recent messages up to maxMessages
  const recent = messages.slice(-finalConfig.maxMessages);

  // 2. Check token budget
  const totalTokens = recent.reduce(
    (sum, msg) => sum + estimateTokenCount(msg.content),
    0,
  );

  if (totalTokens <= finalConfig.maxTokens) {
    return recent;
  }

  // 3. If over budget, remove oldest messages until under budget
  const selected: ChatMessage[] = [];
  let tokenCount = 0;

  for (let i = recent.length - 1; i >= 0; i--) {
    const msg = recent[i];
    const msgTokens = estimateTokenCount(msg.content);

    if (tokenCount + msgTokens <= finalConfig.maxTokens) {
      selected.unshift(msg);
      tokenCount += msgTokens;
    } else {
      break; // Stop if adding next message exceeds budget
    }
  }

  return selected;
}

/**
 * Build conversation context from messages
 */
export function buildConversationContext(messages: ChatMessage[]): string {
  if (messages.length === 0) {
    return "";
  }

  return messages
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join("\n");
}

/**
 * Build system prompt with configuration
 */
export function buildSystemPrompt(
  lessonContext: string,
  ragContext: string = "",
  customInstructions: string = "",
): string {
  const parts = [
    // Core instruction
    "You are a knowledgeable tutor for an online learning platform.",
    "Your primary goal is to help students understand the lesson material.",
    "",

    // Lesson context
    lessonContext && `Lesson Material:\n${lessonContext}`,

    // RAG context (if available)
    ragContext && `\n${ragContext}`,

    // Custom instructions
    customInstructions && `\nAdditional Instructions:\n${customInstructions}`,

    // Guidelines
    "",
    "Guidelines:",
    "- Answer questions based on the provided material",
    "- If asked something outside the material, acknowledge it but redirect to the lesson",
    "- Provide clear, concise explanations suitable for students",
    "- Ask clarifying questions if the student's question is unclear",
    "- Encourage critical thinking and deeper understanding",
  ];

  return parts.filter(Boolean).join("\n");
}

/**
 * Build chat completion messages with memory and context
 */
export function buildMessages(
  currentMessage: string,
  previousMessages: ChatMessage[],
  systemPrompt: string,
) {
  return [
    {
      role: "system" as const,
      content: systemPrompt,
    },
    ...previousMessages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    {
      role: "user" as const,
      content: currentMessage,
    },
  ];
}

/**
 * Estimate total tokens for a chat completion
 */
export function estimateChatTokens(
  systemPrompt: string,
  messages: ChatMessage[],
  currentMessage: string,
): number {
  const systemTokens = estimateTokenCount(systemPrompt);
  const historyTokens = messages.reduce(
    (sum, msg) => sum + estimateTokenCount(msg.content),
    0,
  );
  const currentTokens = estimateTokenCount(currentMessage);

  // Account for message delimiters and formatting
  const overhead = 10 + messages.length * 4;

  return systemTokens + historyTokens + currentTokens + overhead;
}
