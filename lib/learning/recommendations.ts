import type { TabType } from "@/app/components/Tabs";
import type { Lesson } from "@/lib/curriculum/types";
import { getRevisionTarget } from "@/lib/curriculum/knowledge-graph";
import type { LearnerProfile } from "@/lib/db/learner-profile";
import type { StepProgress } from "@/lib/learning/progress";
import type { WorkflowStepId } from "@/lib/learning/journey";

export type StepRecommendation = {
  completedStep: WorkflowStepId | null;
  completedMessage: string;
  nextTab: TabType;
  nextLabel: string;
  estimatedMinutes: number;
  reason: string;
  alternateTab?: TabType;
  alternateLabel?: string;
};

export function getStepRecommendation(
  lesson: Lesson,
  steps: StepProgress,
  profile: LearnerProfile | null,
): StepRecommendation | null {
  if (!steps.learn) {
    return {
      completedStep: null,
      completedMessage: "",
      nextTab: "learn",
      nextLabel: "Learn",
      estimatedMinutes: Math.min(lesson.estimatedMinutes, 15),
      reason: `Start with ${lesson.title} — your AI tutor adapts to what you already know.`,
    };
  }

  if (steps.learn && !steps.practice) {
    return {
      completedStep: "learn",
      completedMessage: "You finished Learn",
      nextTab: "practice",
      nextLabel: "Practice",
      estimatedMinutes: 8,
      reason: "Test understanding with AI-generated interview-style questions.",
    };
  }

  if (steps.practice && profile?.recentQuizScore) {
    const weak = profile.weakConcepts[0];
    const score = profile.recentQuizScore;

    if (!steps.review) {
      return {
        completedStep: "practice",
        completedMessage: `You scored ${score}`,
        nextTab: "review",
        nextLabel: weak ? `Review ${weak}` : "Review",
        estimatedMinutes: 6,
        reason: weak
          ? `Personalized review will target ${weak} and your quiz gaps.`
          : "Get a personalized review based on your quiz performance.",
        alternateTab: !steps.interview ? "interview" : undefined,
        alternateLabel: !steps.interview ? "Mock Interview" : undefined,
      };
    }

    if (!steps.interview) {
      return {
        completedStep: "practice",
        completedMessage: `You scored ${score}`,
        nextTab: "interview",
        nextLabel: "Mock Interview",
        estimatedMinutes: 10,
        reason: "Practice explaining answers like a real technical interview.",
        alternateTab: "review",
        alternateLabel: "Review",
      };
    }
  }

  if (steps.review && !steps.interview) {
    return {
      completedStep: "review",
      completedMessage: "Review complete",
      nextTab: "interview",
      nextLabel: "Mock Interview",
      estimatedMinutes: 10,
      reason: "Apply what you reviewed under interview pressure.",
    };
  }

  if (
    steps.learn &&
    steps.practice &&
    steps.review &&
    steps.interview
  ) {
    return {
      completedStep: "interview",
      completedMessage: "Lesson journey complete!",
      nextTab: "learn",
      nextLabel: "Pick another lesson",
      estimatedMinutes: lesson.estimatedMinutes,
      reason: "You completed Learn → Practice → Review → Mock Interview.",
    };
  }

  return null;
}

export function getGraphRevisionHint(
  lessonId: string,
  weakConcept: string,
): string | null {
  const target = getRevisionTarget(lessonId, weakConcept);
  if (!target) return null;
  if (target.lessonId) {
    return `Consider revisiting prerequisite topic: ${target.concept}`;
  }
  return `Review upstream concept first: ${target.concept}`;
}
