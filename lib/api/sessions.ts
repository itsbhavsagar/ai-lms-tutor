import { apiDelete, apiGet, apiPost } from "./client";

export type SessionSummary = {
  id: string;
  lessonId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  preview: string | null;
};

type SessionResponse = {
  session: { id: string };
};

type SessionsListResponse = {
  sessions: SessionSummary[];
  count: number;
};

export function createSession(userId: string, lessonId: string, title: string) {
  return apiPost<SessionResponse>(
    "/api/sessions",
    { userId, lessonId, title },
    "Failed to create chat session",
  );
}

export function fetchSessions(userId: string, lessonId: string) {
  return apiGet<SessionsListResponse>(
    `/api/sessions?userId=${userId}&lessonId=${lessonId}`,
    "Failed to load conversations",
  );
}

export function deleteSession(sessionId: string) {
  return apiDelete<{ success: boolean }>(
    `/api/sessions/${sessionId}`,
    "Failed to delete chat",
  );
}
