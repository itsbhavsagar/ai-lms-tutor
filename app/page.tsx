"use client";
import { useState } from "react";
import Tabs from "./components/Tabs";
import ChatTab from "./components/ChatTab";
import LessonSidebarPanel from "./components/LessonSidebarPanel";
import MobileLessonNav, { MobileNavToggle } from "./components/MobileLessonNav";
import QuizTab from "./components/QuizTab";
import SummaryTab from "./components/SummaryTab";
import NotesTab from "./components/NotesTab";
import RagTab from "./components/RagTab";
import InterviewTab from "./components/InterviewTab";
import DemoTab from "./components/DemoTab";
import RecruiterDashboard from "./components/RecruiterDashboard";
import { useAppNavigation } from "@/lib/hooks/useAppNavigation";
import { useRecruiterMode } from "@/lib/hooks/useRecruiterMode";

export default function Home() {
  const {
    activeTab,
    selectedLesson,
    selectLesson,
    handleTabChange,
    isClientReady,
  } = useAppNavigation();
  const { enabled: recruiterMode, toggle: toggleRecruiterMode } = useRecruiterMode();
  const [learnHeaderActionsEl, setLearnHeaderActionsEl] =
    useState<HTMLDivElement | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden md:flex-row">
      <aside
        className="hidden h-full w-64 shrink-0 flex-col overflow-hidden md:flex lg:w-72"
        style={{
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--sidebar-border)",
        }}
      >
        <LessonSidebarPanel
          selectedLessonId={selectedLesson.id}
          isClientReady={isClientReady}
          onSelectLesson={selectLesson}
        />
      </aside>

      <MobileLessonNav
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        selectedLessonId={selectedLesson.id}
        isClientReady={isClientReady}
        onSelectLesson={selectLesson}
      />

      <main
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="flex flex-none flex-col border-b px-3 pt-3 sm:px-6 md:px-8 md:pt-6"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="mb-2 flex min-w-0 items-start gap-2 sm:gap-3">
            <MobileNavToggle onOpen={() => setMobileNavOpen(true)} />
            <div className="min-w-0 flex-1">
              <h1
                className="truncate text-lg font-semibold leading-tight tracking-tight sm:text-[22px]"
                style={{ color: "var(--text)" }}
              >
                {recruiterMode
                  ? "Recruiter Demo"
                  : isClientReady
                    ? selectedLesson.title
                    : "\u00A0"}
              </h1>
              <p
                className="mt-1 line-clamp-2 max-w-3xl text-[12px] leading-relaxed sm:line-clamp-none sm:text-[13px]"
                style={{ color: "var(--text-muted)" }}
              >
                {recruiterMode
                  ? "Engineering overview — prompts, streaming, TanStack Query cache, Prisma models."
                  : isClientReady
                    ? selectedLesson.description
                    : "\u00A0"}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleRecruiterMode}
              className="shrink-0 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold sm:px-3 sm:text-[11px]"
              style={{
                borderColor: recruiterMode
                  ? "var(--accent)"
                  : "var(--border-strong)",
                background: recruiterMode
                  ? "var(--accent-soft)"
                  : "var(--surface-raised)",
                color: recruiterMode ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {recruiterMode ? "Exit demo" : "Recruiter demo"}
            </button>
          </div>

          {!recruiterMode && (
            <Tabs
              activeTab={activeTab}
              onChange={handleTabChange}
              showActiveIndicator={isClientReady}
              trailing={
                activeTab === "learn" && isClientReady ? (
                  <div
                    ref={setLearnHeaderActionsEl}
                    className="flex shrink-0 items-center gap-1.5"
                  />
                ) : undefined
              }
            />
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4 md:p-6">
          <div
            className={`flex h-full min-h-0 flex-col rounded-lg ${
              !recruiterMode && activeTab === "learn"
                ? "overflow-hidden p-0"
                : "p-3 sm:rounded-xl sm:p-4 md:p-6"
            }`}
            style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {recruiterMode ? (
              <RecruiterDashboard lessonId={selectedLesson.id} />
            ) : !isClientReady ? null : (
              <>
                {activeTab === "learn" && (
                  <ChatTab
                    key={selectedLesson.id}
                    lesson={selectedLesson}
                    headerActionsEl={learnHeaderActionsEl}
                  />
                )}
                {activeTab === "practice" && (
                  <QuizTab key={selectedLesson.id} lesson={selectedLesson} />
                )}
                {activeTab === "review" && <SummaryTab lesson={selectedLesson} />}
                {activeTab === "interview" && (
                  <InterviewTab lesson={selectedLesson} />
                )}
                {activeTab === "notes" && (
                  <NotesTab key={selectedLesson.id} lesson={selectedLesson} />
                )}
                {activeTab === "rag" && <RagTab lesson={selectedLesson} />}
                {activeTab === "live-chat" && <DemoTab />}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
