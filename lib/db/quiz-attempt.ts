import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const attemptSelectWithWeakConcepts = {
  id: true,
  score: true,
  total: true,
  createdAt: true,
  weakConcepts: true,
} as const;

const attemptSelectLegacy = {
  id: true,
  score: true,
  total: true,
  createdAt: true,
} as const;

export type QuizAttemptRead = {
  id: string;
  score: number;
  total: number;
  createdAt: Date;
  weakConcepts: string[];
};

export function isMissingWeakConceptsColumn(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.message.includes("weakConcepts");
  }
  return error instanceof Error && error.message.includes("weakConcepts");
}

export function normalizeAttempts(
  attempts: Array<{
    id: string;
    score: number;
    total: number;
    createdAt: Date;
    weakConcepts?: string[];
  }>,
): QuizAttemptRead[] {
  return attempts.map((attempt) => ({
    ...attempt,
    weakConcepts: attempt.weakConcepts ?? [],
  }));
}

type QuizWithAttempts = {
  id: string;
  userId: string;
  lessonId: string;
  questions: unknown;
  createdAt: Date;
  attempts: QuizAttemptRead[];
};

export async function findLatestQuizWithAttempts(
  userId: string,
  lessonId: string,
): Promise<QuizWithAttempts | null> {
  try {
    const quiz = await prisma.quiz.findFirst({
      where: { userId, lessonId },
      orderBy: { createdAt: "desc" },
      include: {
        attempts: {
          orderBy: { createdAt: "desc" },
          select: attemptSelectWithWeakConcepts,
        },
      },
    });
    if (!quiz) return null;
    return { ...quiz, attempts: normalizeAttempts(quiz.attempts) };
  } catch (error) {
    if (!isMissingWeakConceptsColumn(error)) throw error;

    const quiz = await prisma.quiz.findFirst({
      where: { userId, lessonId },
      orderBy: { createdAt: "desc" },
      include: {
        attempts: {
          orderBy: { createdAt: "desc" },
          select: attemptSelectLegacy,
        },
      },
    });
    if (!quiz) return null;
    return { ...quiz, attempts: normalizeAttempts(quiz.attempts) };
  }
}

export async function createQuizAttempt(input: {
  quizId: string;
  score: number;
  total: number;
  weakConcepts: string[];
}) {
  const id = crypto.randomUUID();
  const createdAt = new Date();

  try {
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        quizId: string;
        score: number;
        total: number;
        createdAt: Date;
        weakConcepts: string[];
      }>
    >`
      INSERT INTO "QuizAttempt" ("id", "quizId", "score", "total", "weakConcepts", "createdAt")
      VALUES (${id}, ${input.quizId}, ${input.score}, ${input.total}, ${input.weakConcepts}, ${createdAt})
      RETURNING "id", "quizId", "score", "total", "createdAt", "weakConcepts"
    `;

    return normalizeAttempts(rows)[0];
  } catch (error) {
    if (!isMissingWeakConceptsColumn(error)) throw error;

    await prisma.$executeRaw`
      INSERT INTO "QuizAttempt" ("id", "quizId", "score", "total", "createdAt")
      VALUES (${id}, ${input.quizId}, ${input.score}, ${input.total}, ${createdAt})
    `;

    return {
      id,
      quizId: input.quizId,
      score: input.score,
      total: input.total,
      weakConcepts: [],
      createdAt,
    };
  }
}

export async function findQuizAttemptsForProfile(
  quizId: string,
  take: number,
): Promise<QuizAttemptRead[]> {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId },
      orderBy: { createdAt: "desc" },
      take,
      select: attemptSelectWithWeakConcepts,
    });
    return normalizeAttempts(attempts);
  } catch (error) {
    if (!isMissingWeakConceptsColumn(error)) throw error;

    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId },
      orderBy: { createdAt: "desc" },
      take,
      select: attemptSelectLegacy,
    });
    return normalizeAttempts(attempts);
  }
}
