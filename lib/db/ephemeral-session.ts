const EPHEMERAL_SESSION_PREFIX = "ephemeral-";

export function isEphemeralSessionId(sessionId: string): boolean {
  return sessionId.startsWith(EPHEMERAL_SESSION_PREFIX);
}

export function createEphemeralSession(
  userId: string,
  lessonId: string,
  title?: string,
) {
  const now = new Date();
  return {
    id: `${EPHEMERAL_SESSION_PREFIX}${crypto.randomUUID()}`,
    userId,
    lessonId,
    title: title ?? "New Chat",
    createdAt: now,
    updatedAt: now,
  };
}
