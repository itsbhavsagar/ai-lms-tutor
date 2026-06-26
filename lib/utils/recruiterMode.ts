const RECRUITER_MODE_KEY = "lms-recruiter-mode";

const listeners = new Set<() => void>();

export function subscribeRecruiterMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isRecruiterMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(RECRUITER_MODE_KEY) === "1";
}

export function setRecruiterMode(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECRUITER_MODE_KEY, enabled ? "1" : "0");
  listeners.forEach((l) => l());
}
