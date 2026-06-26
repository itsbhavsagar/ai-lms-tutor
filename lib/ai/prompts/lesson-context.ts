import type { Lesson } from "@/lib/curriculum/types";

export function formatLessonContext(lesson: Lesson): string {
  const sections: string[] = [
    `Title: ${lesson.title}`,
    `Description: ${lesson.description}`,
    `Difficulty: ${lesson.difficulty}`,
    `Estimated time: ${lesson.estimatedMinutes} minutes`,
    `Objectives:\n${lesson.objectives.map((o) => `- ${o}`).join("\n")}`,
    `Core concepts:\n${lesson.concepts.map((c) => `- ${c}`).join("\n")}`,
    `Production topics:\n${lesson.productionTopics.map((t) => `- ${t}`).join("\n")}`,
    `Interview focus:\n${lesson.interviewFocus.map((f) => `- ${f}`).join("\n")}`,
  ];

  if (lesson.prerequisites.length > 0) {
    sections.push(
      `Prerequisites:\n${lesson.prerequisites.map((p) => `- ${p}`).join("\n")}`,
    );
  }

  if (lesson.tags.length > 0) {
    sections.push(`Tags: ${lesson.tags.join(", ")}`);
  }

  if (lesson.recommendedResources?.length) {
    sections.push(
      `Recommended resources:\n${lesson.recommendedResources.map((r) => `- ${r}`).join("\n")}`,
    );
  }

  return sections.join("\n\n");
}

export type QuizPerformanceContext = {
  attemptCount: number;
  bestScore: number | null;
  latestScore: number | null;
  totalQuestions: number | null;
};

export function formatQuizPerformance(ctx: QuizPerformanceContext): string {
  if (ctx.attemptCount === 0) {
    return "The student has not completed a quiz for this topic yet.";
  }

  const parts = [`Quiz attempts: ${ctx.attemptCount}`];

  if (ctx.latestScore !== null && ctx.totalQuestions !== null) {
    parts.push(`Latest score: ${ctx.latestScore}/${ctx.totalQuestions}`);
  }

  if (ctx.bestScore !== null && ctx.totalQuestions !== null) {
    parts.push(`Best score: ${ctx.bestScore}/${ctx.totalQuestions}`);
  }

  return parts.join(". ") + ".";
}
