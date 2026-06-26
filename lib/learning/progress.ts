const INTERVIEW_KEY = "lms-interview-done";

export function markInterviewComplete(userId: string, lessonId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${INTERVIEW_KEY}:${userId}:${lessonId}`, "1");
  window.dispatchEvent(new Event("lms-interview-progress"));
}

export function isInterviewComplete(userId: string, lessonId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${INTERVIEW_KEY}:${userId}:${lessonId}`) === "1";
}
