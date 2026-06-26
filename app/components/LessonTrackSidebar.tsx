"use client";

import { useCallback, useState } from "react";
import { RiArrowDownSLine, RiArrowRightSLine } from "react-icons/ri";
import {
  getLessonsByTrack,
  getTrackForLesson,
  tracks,
  type Lesson,
} from "@/lib/curriculum";
import {
  lessonDotActiveClass,
  lessonDotInactiveClass,
  lessonNavItemActiveClass,
  lessonNavItemClass,
} from "@/lib/ui/styles";

type LessonTrackSidebarProps = {
  selectedLessonId: string;
  isClientReady: boolean;
  onSelectLesson: (lesson: Lesson) => void;
};

export default function LessonTrackSidebar({
  selectedLessonId,
  isClientReady,
  onSelectLesson,
}: LessonTrackSidebarProps) {
  const [expandedTrackIds, setExpandedTrackIds] = useState<Set<string>>(() => {
    const track = getTrackForLesson(selectedLessonId);
    return new Set(track ? [track.id] : [tracks[0]?.id].filter(Boolean));
  });

  const toggleTrack = useCallback((trackId: string) => {
    setExpandedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  }, []);

  const handleSelectLesson = useCallback(
    (lesson: Lesson) => {
      setExpandedTrackIds((prev) => {
        if (prev.has(lesson.trackId)) return prev;
        const next = new Set(prev);
        next.add(lesson.trackId);
        return next;
      });
      onSelectLesson(lesson);
    },
    [onSelectLesson],
  );

  return (
    <div className="flex flex-col gap-0.5">
      {tracks.map((track) => {
        const isExpanded = expandedTrackIds.has(track.id);
        const trackLessons = getLessonsByTrack(track.id);

        return (
          <div key={track.id} className="min-w-0">
            <button
              type="button"
              onClick={() => toggleTrack(track.id)}
              className="flex w-full min-w-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-sidebar-text-active transition-colors duration-200 hover:bg-sidebar-hover"
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <RiArrowDownSLine size={16} className="shrink-0 opacity-70" />
              ) : (
                <RiArrowRightSLine size={16} className="shrink-0 opacity-70" />
              )}
              <span className="truncate">{track.title}</span>
            </button>

            {isExpanded && (
              <div className="mb-1 ml-2 flex flex-col gap-0.5 border-l border-sidebar-border py-0.5 pl-2">
                {trackLessons.map((lesson) => {
                  const active =
                    isClientReady && selectedLessonId === lesson.id;

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => handleSelectLesson(lesson)}
                      className={`${lessonNavItemClass} ${active ? lessonNavItemActiveClass : ""}`}
                    >
                      <span
                        className={`mt-[7px] h-1 w-1 shrink-0 rounded-full ${active ? lessonDotActiveClass : lessonDotInactiveClass}`}
                        aria-hidden
                      />
                      <span className="min-w-0 leading-snug">{lesson.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
