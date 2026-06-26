export type Difficulty = "beginner" | "intermediate" | "advanced";

export type Lesson = {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  objectives: string[];
  prerequisites: string[];
  concepts: string[];
  productionTopics: string[];
  interviewFocus: string[];
  tags: string[];
  recommendedResources?: string[];
};

export type Track = {
  id: string;
  title: string;
};
