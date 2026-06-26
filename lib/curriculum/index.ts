import { lessons, tracks } from "./lessons";
import type { Lesson, Track, TrackId } from "./types";

const trackLessonOrder: Record<TrackId, readonly string[]> = {
  "ai-engineering": [
    "prompt-engineering",
    "rag",
    "embeddings",
    "ai-agents",
  ],
  frontend: [
    "react-fundamentals",
    "react-performance",
    "nextjs-app-router",
    "tanstack-query",
  ],
  backend: ["rest-api-design", "authentication", "postgresql"],
  "system-design": ["system-design-fundamentals", "observability"],
};

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}

export function getLessonsByTrack(trackId: TrackId): Lesson[] {
  const byId = new Map(
    lessons
      .filter((lesson) => lesson.trackId === trackId)
      .map((lesson) => [lesson.id, lesson]),
  );

  return trackLessonOrder[trackId]
    .map((id) => byId.get(id))
    .filter((lesson): lesson is Lesson => !!lesson);
}

export function getTrackForLesson(lessonId: string): Track | undefined {
  const lesson = getLessonById(lessonId);
  if (!lesson) return undefined;
  return tracks.find((track) => track.id === lesson.trackId);
}

export { lessons, tracks };
export { getLessonIcon, getTrackIcon } from "./sidebar-icons";
export type { Lesson, Track, TrackId } from "./types";
