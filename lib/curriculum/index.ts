import { lessons, tracks } from "./lessons";
import type { Lesson, Track } from "./types";

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}

export function getLessonsByTrack(trackId: string): Lesson[] {
  return lessons.filter((lesson) =>
    lesson.tags.some((tag) => tag.startsWith(trackId.replace("-engineering", ""))),
  );
}

export { lessons, tracks };
export type { Lesson, Track, Difficulty } from "./types";
