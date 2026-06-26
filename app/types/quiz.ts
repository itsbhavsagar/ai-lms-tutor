export type QuizDifficulty = "beginner" | "intermediate" | "advanced";

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  checksConcept?: string;
  difficulty?: QuizDifficulty;
  explanation?: string;
  whyOthersWrong?: string[];
  interviewTakeaway?: string;
}
