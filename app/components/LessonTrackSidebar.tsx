"use client";

import { useCallback, useState } from "react";
import { RiArrowDownSLine, RiArrowRightSLine } from "react-icons/ri";
import {
  getLessonIcon,
  getLessonsByTrack,
  getTrackForLesson,
  getTrackIcon,
  tracks,
  type Lesson,
} from "@/lib/curriculum";

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
        const TrackIcon = getTrackIcon(track.id);

        return (
          <div key={track.id} className="min-w-0">
            <button
              type="button"
              onClick={() => toggleTrack(track.id)}
              className="sidebar-track-btn"
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <RiArrowDownSLine size={14} className="sidebar-chevron" />
              ) : (
                <RiArrowRightSLine size={14} className="sidebar-chevron" />
              )}
              <span className="sidebar-track-icon" aria-hidden>
                <TrackIcon size={15} />
              </span>
              <span className="sidebar-track-label">{track.title}</span>
            </button>

            {isExpanded && (
              <div className="sidebar-lessons">
                {trackLessons.map((lesson) => {
                  const active =
                    isClientReady && selectedLessonId === lesson.id;
                  const LessonIcon = getLessonIcon(lesson.id);

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => handleSelectLesson(lesson)}
                      className="sidebar-lesson-btn"
                      data-active={active}
                    >
                      <span
                        className="sidebar-lesson-icon"
                        data-active={active}
                        aria-hidden
                      >
                        <LessonIcon size={12} />
                      </span>
                      <span className="sidebar-lesson-label">{lesson.title}</span>
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
