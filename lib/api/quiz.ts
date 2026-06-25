import { apiGet, apiPost } from "./client";
import type { QuizQuestion } from "@/app/types/quiz";

type QuizGetResponse = {
  quiz: { id: string; questions: QuizQuestion[] } | null;
  attempts: { score: number; total: number }[];
};

export function fetchQuiz(userId: string, lessonId: string) {
  return apiGet<QuizGetResponse>(
    `/api/quiz?userId=${userId}&lessonId=${lessonId}`,
    "Failed to load quiz",
  );
}

export function generateQuiz(payload: {
  lessonContent: string;
  lessonTitle: string;
  userId: string;
  lessonId: string;
}) {
  return apiPost<{ questions: QuizQuestion[] }>(
    "/api/quiz",
    payload,
    "Failed to generate quiz",
  );
}

export function submitQuiz(payload: {
  quizId: string;
  score: number;
  total: number;
}) {
  return apiPost("/api/quiz/submit", payload, "Failed to submit quiz");
}
