"use client";

import { RiGraduationCapLine } from "react-icons/ri";
import type { Lesson } from "@/lib/curriculum";
import LessonTrackSidebar from "./LessonTrackSidebar";
import SidebarFooter from "./SidebarFooter";

const BRAND_NAME = "AI LMS Tutor";
const BRAND_STACK = "Groq · Cohere · RAG";
const TRACKS_LABEL = "Learning Tracks";

type LessonSidebarPanelProps = {
  selectedLessonId: string;
  isClientReady: boolean;
  onSelectLesson: (lesson: Lesson) => void;
  className?: string;
};

export default function LessonSidebarPanel({
  selectedLessonId,
  isClientReady,
  onSelectLesson,
  className = "",
}: LessonSidebarPanelProps) {
  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`.trim()}>
      <div className="flex flex-none items-center gap-2.5 px-4 py-4 sm:px-5 md:pt-6 md:pb-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent">
          <RiGraduationCapLine size={16} className="text-on-accent" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold leading-tight text-sidebar-text-active">
            {BRAND_NAME}
          </p>
          <p className="truncate text-[10px] text-sidebar-text">
            Powered By: {BRAND_STACK}
          </p>
        </div>
      </div>

      <p className="mb-2 flex-none px-4 text-[11px] font-semibold uppercase tracking-widest text-sidebar-text opacity-50 sm:px-5 md:text-[12px]">
        {TRACKS_LABEL}
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 md:px-3 md:pb-4">
        <LessonTrackSidebar
          selectedLessonId={selectedLessonId}
          isClientReady={isClientReady}
          onSelectLesson={onSelectLesson}
        />
      </div>

      <SidebarFooter />
    </div>
  );
}
