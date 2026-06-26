import type { TabType } from "@/app/components/Tabs";

export type WorkflowStepId = "learn" | "practice" | "interview" | "review";

export type WorkflowStep = {
  id: WorkflowStepId;
  tab: TabType;
  label: string;
};


export const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: "learn", tab: "learn", label: "Learn" },
  { id: "practice", tab: "practice", label: "Practice" },
  { id: "interview", tab: "interview", label: "Mock Interview" },
  { id: "review", tab: "review", label: "Review" },
];

export const LEGACY_TAB_MAP: Record<string, TabType> = {
  chat: "learn",
  quiz: "practice",
  summary: "review",
};

export function migrateTabId(saved: string): TabType | null {
  if (LEGACY_TAB_MAP[saved]) return LEGACY_TAB_MAP[saved];
  return saved as TabType;
}
