"use client";

import { RiBookOpenLine, RiMap2Line } from "react-icons/ri";
import type { Lesson } from "@/lib/curriculum";
import { scrollAreaClass } from "@/lib/ui/styles";
import LessonTrackSidebar from "./LessonTrackSidebar";
import SidebarFooter from "./SidebarFooter";

const BRAND_NAME = "AI LMS TUTOR";
const BRAND_TAGLINE = "Your AI learning studio";
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
      <header className="sidebar-brand">
        <div className="sidebar-brand-mark" aria-hidden>
          <RiBookOpenLine size={22} />
        </div>
        <div className="min-w-0">
          <p className="sidebar-brand-title">{BRAND_NAME}</p>
          <p className="sidebar-brand-tagline">{BRAND_TAGLINE}</p>
          <p className="sidebar-brand-subtitle">{BRAND_STACK}</p>
        </div>
      </header>

      <div className="sidebar-nav-inner">
        <p className="sidebar-section-label">
          <RiMap2Line size={13} aria-hidden />
          {TRACKS_LABEL}
        </p>

        <div className={`${scrollAreaClass} min-h-0 flex-1`}>
          <LessonTrackSidebar
            selectedLessonId={selectedLessonId}
            isClientReady={isClientReady}
            onSelectLesson={onSelectLesson}
          />
        </div>
      </div>

      <SidebarFooter />
    </div>
  );
}
