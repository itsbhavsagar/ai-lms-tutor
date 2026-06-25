"use client";

import { useSyncExternalStore } from "react";
import type { TabType } from "@/app/components/Tabs";
import { lessons, type Lesson } from "@/app/data/lessons";
import {
  persistLessonId,
  persistTab,
  readPersistedLessonId,
  readPersistedTab,
  subscribeLesson,
  subscribeTab,
} from "@/lib/utils/appNavigation";

const DEFAULT_LESSON_ID = lessons[0].id;

function readLessonId(): string {
  return readPersistedLessonId() ?? DEFAULT_LESSON_ID;
}

function emptySubscribe(): () => void {
  return () => {};
}

export function useAppNavigation() {
  const isClientReady = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const activeTab = useSyncExternalStore(
    subscribeTab,
    readPersistedTab,
    (): TabType => "chat",
  );

  const selectedLessonId = useSyncExternalStore(
    subscribeLesson,
    readLessonId,
    () => DEFAULT_LESSON_ID,
  );

  const selectedLesson =
    lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0];

  function selectLesson(lesson: Lesson) {
    persistLessonId(lesson.id);
  }

  function handleTabChange(tab: TabType) {
    persistTab(tab);
  }

  return {
    activeTab,
    selectedLesson,
    selectLesson,
    handleTabChange,
    isClientReady,
  };
}
