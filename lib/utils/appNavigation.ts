import type { TabType } from "@/app/components/Tabs";

const TAB_KEY = "lms-active-tab";
const LESSON_KEY = "lms-selected-lesson-id";

const VALID_TABS = new Set<TabType>([
  "chat",
  "quiz",
  "summary",
  "notes",
  "rag",
  "live-chat",
]);

type Listener = () => void;

const tabListeners = new Set<Listener>();
const lessonListeners = new Set<Listener>();

function notify(listeners: Set<Listener>) {
  listeners.forEach((listener) => listener());
}

export function subscribeTab(listener: Listener): () => void {
  tabListeners.add(listener);
  return () => tabListeners.delete(listener);
}

export function subscribeLesson(listener: Listener): () => void {
  lessonListeners.add(listener);
  return () => lessonListeners.delete(listener);
}

export function readPersistedTab(): TabType {
  if (typeof window === "undefined") return "chat";
  const saved = localStorage.getItem(TAB_KEY);
  return saved && VALID_TABS.has(saved as TabType)
    ? (saved as TabType)
    : "chat";
}

export function persistTab(tab: TabType): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TAB_KEY, tab);
  notify(tabListeners);
}

export function readPersistedLessonId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LESSON_KEY);
}

export function persistLessonId(lessonId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LESSON_KEY, lessonId);
  notify(lessonListeners);
}
