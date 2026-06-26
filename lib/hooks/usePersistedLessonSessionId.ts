"use client";

import { useSyncExternalStore } from "react";
import {
  readLessonSessionId,
  subscribeLessonSessionId,
} from "@/lib/chat/sessionStorage";

export function usePersistedLessonSessionId(lessonId: string): string | null {
  return useSyncExternalStore(
    (onStoreChange) => subscribeLessonSessionId(lessonId, onStoreChange),
    () => readLessonSessionId(lessonId),
    () => null,
  );
}
