const sessionKey = (lessonId: string) => `sessionId_${lessonId}`;

const listeners = new Map<string, Set<() => void>>();

function notifyLessonSessionChange(lessonId: string) {
  listeners.get(lessonId)?.forEach((listener) => listener());
}

export function subscribeLessonSessionId(
  lessonId: string,
  onStoreChange: () => void,
) {
  if (!listeners.has(lessonId)) {
    listeners.set(lessonId, new Set());
  }
  listeners.get(lessonId)!.add(onStoreChange);
  return () => {
    listeners.get(lessonId)?.delete(onStoreChange);
  };
}

export function readLessonSessionId(lessonId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(sessionKey(lessonId));
}

export function persistLessonSessionId(lessonId: string, sessionId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(sessionKey(lessonId), sessionId);
  notifyLessonSessionChange(lessonId);
}

export function clearLessonSessionId(lessonId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(sessionKey(lessonId));
  notifyLessonSessionChange(lessonId);
}
