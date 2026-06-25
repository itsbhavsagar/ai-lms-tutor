const sessionKey = (lessonId: string) => `sessionId_${lessonId}`;

export function readLessonSessionId(lessonId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(sessionKey(lessonId));
}

export function persistLessonSessionId(lessonId: string, sessionId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(sessionKey(lessonId), sessionId);
}

export function clearLessonSessionId(lessonId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(sessionKey(lessonId));
}
