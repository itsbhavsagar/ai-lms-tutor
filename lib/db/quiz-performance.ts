import { prisma } from "@/lib/db/prisma";
import type { QuizPerformanceContext } from "@/lib/ai/prompts/lesson-context";

const EMPTY_QUIZ_PERFORMANCE: QuizPerformanceContext = {
  attemptCount: 0,
  bestScore: null,
  latestScore: null,
  totalQuestions: null,
};

export async function getQuizPerformanceSafe(
  userId: string,
  lessonId: string,
): Promise<QuizPerformanceContext> {
  try {
    return await getQuizPerformance(userId, lessonId);
  } catch (error) {
    console.error("[QuizPerformance] DB unavailable:", error);
    return EMPTY_QUIZ_PERFORMANCE;
  }
}

export async function getQuizPerformance(
  userId: string,
  lessonId: string,
): Promise<QuizPerformanceContext> {
  const quiz = await prisma.quiz.findFirst({
    where: { userId, lessonId },
    orderBy: { createdAt: "desc" },
    include: {
      attempts: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!quiz || quiz.attempts.length === 0) {
    return {
      attemptCount: 0,
      bestScore: null,
      latestScore: null,
      totalQuestions: null,
    };
  }

  const questions = JSON.parse(quiz.questions as string) as unknown[];
  const totalQuestions = questions.length;
  const latestScore = quiz.attempts[0]?.score ?? null;
  const bestScore = Math.max(...quiz.attempts.map((a) => a.score));

  return {
    attemptCount: quiz.attempts.length,
    bestScore,
    latestScore,
    totalQuestions,
  };
}
