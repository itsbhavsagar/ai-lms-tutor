"use client";

import { useEffect } from "react";
import { RiCloseLine, RiMenuLine } from "react-icons/ri";
import type { Lesson } from "@/lib/curriculum";
import { chatBtnClass } from "@/lib/chat/interactive";
import LessonSidebarPanel from "./LessonSidebarPanel";

type MobileLessonNavProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLessonId: string;
  isClientReady: boolean;
  onSelectLesson: (lesson: Lesson) => void;
};

export function MobileNavToggle({
  onOpen,
  label = "Open learning tracks",
}: {
  onOpen: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className={`${chatBtnClass} flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border md:hidden`}
      style={{
        borderColor: "var(--border-strong)",
        background: "var(--bg-panel)",
        color: "var(--text-muted)",
      }}
    >
      <RiMenuLine size={18} />
    </button>
  );
}

export default function MobileLessonNav({
  open,
  onOpenChange,
  selectedLessonId,
  isClientReady,
  onSelectLesson,
}: MobileLessonNavProps) {
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  function handleSelectLesson(lesson: Lesson) {
    onSelectLesson(lesson);
    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={() => onOpenChange(false)}
      />
      <div
        className="mobile-nav-drawer absolute inset-y-0 left-0 flex w-[min(88vw,20rem)] max-w-full flex-col shadow-xl"
        style={{
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--sidebar-border)",
        }}
      >
        <div
          className="flex flex-none justify-end px-3 pt-3"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close menu"
            className={`${chatBtnClass} flex h-9 w-9 items-center justify-center rounded-lg`}
            style={{ color: "var(--text-sidebar)" }}
          >
            <RiCloseLine size={20} />
          </button>
        </div>
        <LessonSidebarPanel
          selectedLessonId={selectedLessonId}
          isClientReady={isClientReady}
          onSelectLesson={handleSelectLesson}
          className="pt-0"
        />
      </div>
    </div>
  );
}
