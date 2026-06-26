import type { ChatMessage } from "@/app/types/chat";
import type { SessionSummary } from "@/lib/api/sessions";

function sessionsCacheKey(userId: string, lessonId: string) {
  return `chat_sessions_${userId}_${lessonId}`;
}

function messagesCacheKey(sessionId: string) {
  return `chat_messages_${sessionId}`;
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors — network fetch remains the fallback.
  }
}

export function readCachedSessions(
  userId: string,
  lessonId: string,
): SessionSummary[] {
  return readJson<SessionSummary[]>(sessionsCacheKey(userId, lessonId)) ?? [];
}

export function persistCachedSessions(
  userId: string,
  lessonId: string,
  sessions: SessionSummary[],
) {
  writeJson(sessionsCacheKey(userId, lessonId), sessions);
}

export function removeCachedSession(
  userId: string,
  lessonId: string,
  sessionId: string,
) {
  const sessions = readCachedSessions(userId, lessonId).filter(
    (session) => session.id !== sessionId,
  );
  persistCachedSessions(userId, lessonId, sessions);
}

export function readCachedChatMessages(sessionId: string): ChatMessage[] {
  return readJson<ChatMessage[]>(messagesCacheKey(sessionId)) ?? [];
}

export function persistCachedChatMessages(
  sessionId: string,
  messages: ChatMessage[],
) {
  if (messages.length === 0) return;
  writeJson(messagesCacheKey(sessionId), messages);
}

export function clearCachedChatMessages(sessionId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(messagesCacheKey(sessionId));
}
