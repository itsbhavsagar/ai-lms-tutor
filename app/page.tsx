"use client";
import { lessons } from "./data/lessons";
import Tabs from "./components/Tabs";
import ChatTab from "./components/ChatTab";
import QuizTab from "./components/QuizTab";
import SummaryTab from "./components/SummaryTab";
import NotesTab from "./components/NotesTab";
import RagTab from "./components/RagTab";
import InterviewTab from "./components/InterviewTab";
import DemoTab from "./components/DemoTab";
import RecruiterDashboard from "./components/RecruiterDashboard";
import { RiGraduationCapLine } from "react-icons/ri";
import { useAppNavigation } from "@/lib/hooks/useAppNavigation";
import { useRecruiterMode } from "@/lib/hooks/useRecruiterMode";

const BRAND_NAME = "AI LMS Tutor";
const BRAND_STACK = "Groq · Cohere · RAG";
const LESSONS_LABEL = "Lessons";
const BUILT_BY =
  "Built by Bhavsagar · Next.js · Groq · Cohere · PostgresSQL · Prisma";

export default function Home() {
  const {
    activeTab,
    selectedLesson,
    selectLesson,
    handleTabChange,
    isClientReady,
  } = useAppNavigation();
  const { enabled: recruiterMode, toggle: toggleRecruiterMode } = useRecruiterMode();

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden md:flex-row">
      <aside
        className="flex max-h-[42dvh] w-full flex-none flex-col overflow-hidden md:h-full md:max-h-none md:w-64 lg:w-72"
        style={{
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--sidebar-border)",
          borderBottom: "1px solid var(--sidebar-border)",
        }}
      >
        <div className="flex items-center gap-2.5 px-4 py-4 sm:px-5 md:pt-6 md:pb-5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "var(--accent)" }}
          >
            <RiGraduationCapLine size={16} color="var(--on-accent)" />
          </div>
          <div className="min-w-0">
            <p
              className="truncate text-[16px] font-semibold leading-tight"
              style={{ color: "var(--text-sidebar-active)" }}
            >
              {BRAND_NAME}
            </p>
            <p
              className="truncate text-[10px]"
              style={{ color: "var(--text-sidebar)" }}
            >
              Powered By: {BRAND_STACK}
            </p>
          </div>
        </div>

        <p
          className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-widest sm:px-5 md:text-[16px]"
          style={{ color: "var(--text-sidebar)", opacity: 0.5 }}
        >
          {LESSONS_LABEL}
        </p>

        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-4 pb-3 md:overflow-x-hidden md:overflow-y-auto md:px-3 md:pb-4">
          <div className="flex gap-2 md:flex-col md:gap-0.5">
            {lessons.map((lesson) => {
              const active = selectedLesson.id === lesson.id;
              return (
                <button
                  key={lesson.id}
                  onClick={() => selectLesson(lesson)}
                  className="min-w-44 flex-none rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors duration-200 md:w-full md:min-w-0"
                  style={{
                    background: active
                      ? "var(--bg-sidebar-active)"
                      : "transparent",
                    color: active
                      ? "var(--text-sidebar-active)"
                      : "var(--text-sidebar)",
                  }}
                >
                  {lesson.title}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="border-t px-4 py-2 sm:px-5 md:py-4"
          style={{ borderColor: "var(--sidebar-border)" }}
        >
          <p
            className="line-clamp-2 text-[10px] leading-relaxed md:line-clamp-none"
            style={{ color: "var(--text-sidebar)", opacity: 0.4 }}
          >
            {BUILT_BY}
          </p>
        </div>
      </aside>

      <main
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="flex flex-none flex-col border-b px-4 pt-4 sm:px-6 md:px-8 md:pt-6"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="mb-2 flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1
                className="truncate text-xl font-semibold leading-tight tracking-tight sm:text-[22px]"
                style={{ fontFamily: "'Lora', serif", color: "var(--text)" }}
              >
                {recruiterMode ? "Recruiter Demo" : selectedLesson.title}
              </h1>
              <p
                className="mt-1 max-w-3xl text-[12px] leading-relaxed sm:text-[13px]"
                style={{ color: "var(--text-muted)" }}
              >
                {recruiterMode
                  ? "Engineering overview — prompts, streaming, TanStack Query cache, Prisma models."
                  : selectedLesson.description}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleRecruiterMode}
              className="shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-semibold"
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
            ) : (
              <>
                {activeTab === "learn" && (
                  <ChatTab key={selectedLesson.id} lesson={selectedLesson} />
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
