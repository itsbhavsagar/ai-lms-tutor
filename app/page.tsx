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
import {
  lmsFrameClass,
  appShellClass,
  btnGreenClass,
  contentCardLearnClass,
  contentCardTabClass,
  floatingMainClass,
  mainHeaderClass,
  mainBodyClass,
  floatingSidebarClass,
  pageSubtitleClass,
  pageTitleClass,
} from "@/lib/ui/styles";

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
    <div className={lmsFrameClass}>
      <div className={appShellClass}>
      <aside className="hidden w-64 shrink-0 md:flex lg:w-72">
        <div className={floatingSidebarClass}>
          <LessonSidebarPanel
            selectedLessonId={selectedLesson.id}
            isClientReady={isClientReady}
            onSelectLesson={selectLesson}
          />
        </div>
      </aside>

      <MobileLessonNav
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        selectedLessonId={selectedLesson.id}
        isClientReady={isClientReady}
        onSelectLesson={selectLesson}
      />

      <main className={floatingMainClass}>
        <div className={mainHeaderClass}>
          <div className="mb-2 flex min-w-0 items-start gap-2 sm:gap-3">
            <MobileNavToggle onOpen={() => setMobileNavOpen(true)} />
            <div className="min-w-0 flex-1">
              <h1 className={pageTitleClass}>
                {recruiterMode
                  ? "Recruiter Demo"
                  : isClientReady
                    ? selectedLesson.title
                    : "\u00A0"}
              </h1>
              <p className={pageSubtitleClass}>
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
              className={btnGreenClass}
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

        <div className={mainBodyClass}>
          <div
            className={
              !recruiterMode &&
              (activeTab === "learn" || activeTab === "live-chat")
                ? contentCardLearnClass
                : contentCardTabClass
            }
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
    </div>
  );
}
