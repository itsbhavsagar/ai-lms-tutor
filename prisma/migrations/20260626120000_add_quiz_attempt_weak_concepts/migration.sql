-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN "weakConcepts" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
