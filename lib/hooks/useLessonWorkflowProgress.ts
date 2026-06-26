import { useMemo, useSyncExternalStore } from "react";
import { useQuizQuery } from "@/lib/hooks/queries/useQuiz";
import { useSummaryQuery } from "@/lib/hooks/queries/useSummary";
import { isInterviewComplete } from "@/lib/learning/progress";
import {
  buildLessonWorkflowProgress,
  type LessonWorkflowProgress,
} from "@/lib/learning/workflow-progress";

function subscribeInterviewProgress(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("lms-interview-progress", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("lms-interview-progress", onStoreChange);
  };
}

export function useLessonWorkflowProgress(
  lessonId: string,
  userId: string | null,
  hasChat: boolean,
): LessonWorkflowProgress {
  const { data: quizData } = useQuizQuery(lessonId);
  const { data: summaryData } = useSummaryQuery(lessonId);

  const interviewComplete = useSyncExternalStore(
    subscribeInterviewProgress,
    () => (userId ? isInterviewComplete(userId, lessonId) : false),
    () => false,
  );

  return useMemo(
    () =>
      buildLessonWorkflowProgress({
        hasChat,
        hasQuizAttempt: (quizData?.attempts.length ?? 0) > 0,
        interviewComplete,
        hasReview: !!summaryData?.summary,
      }),
    [
      hasChat,
      quizData?.attempts.length,
      interviewComplete,
      summaryData?.summary,
    ],
  );
}
