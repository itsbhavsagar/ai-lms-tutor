const INTERVIEW_KEY = "lms-interview-done";

const interviewListeners = new Set<() => void>();

function notifyInterview() {
  interviewListeners.forEach((l) => l());
}

export function subscribeInterview(listener: () => void): () => void {
  interviewListeners.add(listener);
  return () => interviewListeners.delete(listener);
}

export function markInterviewComplete(userId: string, lessonId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${INTERVIEW_KEY}:${userId}:${lessonId}`, "1");
  notifyInterview();
}

export function isInterviewComplete(userId: string, lessonId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${INTERVIEW_KEY}:${userId}:${lessonId}`) === "1";
}

export type StepProgress = {
  learn: boolean;
  practice: boolean;
  interview: boolean;
  review: boolean;
};

export function computeProgress(steps: StepProgress): number {
  const done = [steps.learn, steps.practice, steps.interview, steps.review].filter(
    Boolean,
  ).length;
  return Math.round((done / 4) * 100);
}
