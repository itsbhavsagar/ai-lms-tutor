export const queryKeys = {
  all: ["lms"] as const,
  quiz: (userId: string, lessonId: string) =>
    [...queryKeys.all, "quiz", userId, lessonId] as const,
  notes: (userId: string, lessonId: string) =>
    [...queryKeys.all, "notes", userId, lessonId] as const,
  summary: (userId: string, lessonId: string) =>
    [...queryKeys.all, "summary", userId, lessonId] as const,
  messages: (sessionId: string) =>
    [...queryKeys.all, "messages", sessionId] as const,
  ragIndex: (userId: string, lessonId: string) =>
    [...queryKeys.all, "rag-index", userId, lessonId] as const,
  sessions: (userId: string, lessonId: string) =>
    [...queryKeys.all, "sessions", userId, lessonId] as const,
  learnerProfile: (userId: string, lessonId: string) =>
    [...queryKeys.all, "learner-profile", userId, lessonId] as const,
};
