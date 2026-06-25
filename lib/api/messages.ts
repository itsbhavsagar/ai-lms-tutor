import { apiGet } from "./client";
import type { ChatMessage } from "@/app/types/chat";

type MessagesResponse = {
  messages: ChatMessage[];
  nextCursor: string | null;
};

export function fetchMessages(sessionId: string, cursor?: string) {
  const params = new URLSearchParams({ sessionId });
  if (cursor) params.set("cursor", cursor);
  return apiGet<MessagesResponse>(
    `/api/messages?${params.toString()}`,
    cursor ? "Failed to load older messages" : "Failed to load messages",
  );
}
