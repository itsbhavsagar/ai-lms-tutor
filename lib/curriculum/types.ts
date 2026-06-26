export type Difficulty = "beginner" | "intermediate" | "advanced";

export type TrackId =
  | "ai-engineering"
  | "frontend"
  | "backend"
  | "system-design";

export type Lesson = {
  id: string;
  trackId: TrackId;
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
  id: TrackId;
  title: string;
};
