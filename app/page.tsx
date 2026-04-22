"use client";
import { useState } from "react";
import { lessons, Lesson } from "./data/lessons";
import Tabs, { TabType } from "./components/Tabs";
import ChatTab from "./components/ChatTab";
import QuizTab from "./components/QuizTab";
import SummaryTab from "./components/SummaryTab";
import NotesTab from "./components/NotesTab";
import RagTab from "./components/RagTab";
import DemoTab from "./components/DemoTab";
import { RiGraduationCapLine } from "react-icons/ri";

const TAB_SUBTITLE =
  "AI-powered learning — ask questions, take quizzes, and review summaries.";
const BRAND_NAME = "AI LMS Tutor";
const BRAND_STACK = "Groq · Cohere · RAG";
const LESSONS_LABEL = "Lessons";
const BUILT_BY =
  "Built by Bhavsagar · Next.js · Groq · Cohere · PostgresSQL · Prisma";

export default function Home() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(lessons[0]);
  const [activeTab, setActiveTab] = useState<TabType>("chat");

  function selectLesson(lesson: Lesson) {
    setSelectedLesson(lesson);
    setActiveTab("chat");
  }

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden md:flex-row">
      <aside
        className="flex max-h-[42dvh] w-full flex-none flex-col overflow-hidden md:h-full md:max-h-none md:w-64 lg:w-72"
        style={{
          background: "var(--bg-sidebar)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-2.5 px-4 py-4 sm:px-5 md:pt-6 md:pb-5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "var(--accent)" }}
          >
            <RiGraduationCapLine size={16} color="#fff" />
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
                  className="min-w-44 flex-none rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors duration-150 md:w-full md:min-w-0"
                  style={{
                    background: active
                      ? "rgba(255,255,255,0.06)"
                      : "transparent",
                    color: active ? "#fff" : "var(--text-sidebar)",
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
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
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
          <div className="mb-4 min-w-0">
            <h1
              className="mb-0.5 truncate text-xl font-semibold leading-tight tracking-tight sm:text-[22px]"
              style={{ fontFamily: "'Lora', serif", color: "var(--text)" }}
            >
              {selectedLesson.title}
            </h1>
            <p
              className="max-w-3xl text-[12px] leading-relaxed sm:text-[13px]"
              style={{ color: "var(--text-muted)" }}
            >
              {TAB_SUBTITLE}
            </p>
          </div>
          <Tabs activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4 md:p-6">
          <div
            className="flex h-full min-h-0 flex-col rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6"
            style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {activeTab === "chat" && <ChatTab lesson={selectedLesson} />}
            {activeTab === "quiz" && <QuizTab lesson={selectedLesson} />}
            {activeTab === "summary" && <SummaryTab lesson={selectedLesson} />}
            {activeTab === "notes" && <NotesTab lesson={selectedLesson} />}
            {activeTab === "rag" && <RagTab lesson={selectedLesson} />}
            {activeTab === "live-chat" && <DemoTab />}
          </div>
        </div>
      </main>
    </div>
  );
}
