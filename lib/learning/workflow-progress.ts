import type { WorkflowStepId } from "./journey";

export type WorkflowStepStatus = "complete" | "pending" | "ready";

export type LessonWorkflowProgress = {
  learn: WorkflowStepStatus;
  practice: WorkflowStepStatus;
  interview: WorkflowStepStatus;
  review: WorkflowStepStatus;
  nextStep: WorkflowStepId | null;
  nextStepLabel: string | null;
};

export function buildLessonWorkflowProgress(input: {
  hasChat: boolean;
  hasQuizAttempt: boolean;
  interviewComplete: boolean;
  hasReview: boolean;
}): LessonWorkflowProgress {
  const learn: WorkflowStepStatus = input.hasChat ? "complete" : "pending";
  const practice: WorkflowStepStatus = input.hasQuizAttempt
    ? "complete"
    : learn === "complete"
      ? "pending"
      : "pending";
  const interview: WorkflowStepStatus = input.interviewComplete
    ? "complete"
    : practice === "complete"
      ? "ready"
      : "pending";
  const review: WorkflowStepStatus = input.hasReview
    ? "complete"
    : interview === "complete"
      ? "ready"
      : "pending";

  let nextStep: WorkflowStepId | null = null;
  let nextStepLabel: string | null = null;

  if (learn !== "complete") {
    nextStep = "learn";
    nextStepLabel = "Start learning";
  } else if (practice !== "complete") {
    nextStep = "practice";
    nextStepLabel = "Practice pending";
  } else if (interview !== "complete") {
    nextStep = "interview";
    nextStepLabel = interview === "ready" ? "Interview ready" : "Interview pending";
  } else if (review !== "complete") {
    nextStep = "review";
    nextStepLabel = review === "ready" ? "Review ready" : "Review pending";
  }

  return {
    learn,
    practice,
    interview,
    review,
    nextStep,
    nextStepLabel,
  };
}

const STEP_SHORT: Record<WorkflowStepId, string> = {
  learn: "Learn",
  practice: "Practice",
  interview: "Interview",
  review: "Review",
};

export function formatWorkflowProgressLine(
  progress: LessonWorkflowProgress,
  compact = false,
): string {
  const parts = (["learn", "practice", "interview", "review"] as const).map(
    (step) => {
      const status = progress[step];
      const label = STEP_SHORT[step];
      if (status === "complete") return `${label} ✓`;
      if (status === "ready") return `${label} ready`;
      if (compact) return null;
      return `${label} pending`;
    },
  );

  const visible = parts.filter(Boolean);
  if (visible.length > 0) return visible.join(" · ");
  return "All steps complete";
}

export function formatWorkflowSubtitle(progress: LessonWorkflowProgress): string {
  if (progress.nextStepLabel) return progress.nextStepLabel;
  return "All steps complete";
}
