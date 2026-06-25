import { apiPost } from "./client";

type SessionResponse = {
  session: { id: string };
};

export function createSession(userId: string, lessonId: string, title: string) {
  return apiPost<SessionResponse>(
    "/api/sessions",
    { userId, lessonId, title },
    "Failed to create chat session",
  );
}
