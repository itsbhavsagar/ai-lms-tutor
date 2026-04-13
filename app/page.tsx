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
    <div className="flex h-full w-full overflow-hidden">
      <aside
        className="flex h-full w-60 flex-none flex-col overflow-hidden"
        style={{
          background: "var(--bg-sidebar)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "var(--accent)" }}
          >
            <RiGraduationCapLine size={16} color="#fff" />
          </div>
          <div>
            <p
              className="text-[16px] font-semibold leading-tight"
              style={{ color: "var(--text-sidebar-active)" }}
            >
              {BRAND_NAME}
            </p>
            <p className="text-[10px]" style={{ color: "var(--text-sidebar)" }}>
              Powered By: {BRAND_STACK}
            </p>
          </div>
        </div>

        <p
          className="mb-2 px-5 text-[16px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-sidebar)", opacity: 0.5 }}
        >
          {LESSONS_LABEL}
        </p>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="flex flex-col gap-0.5">
            {lessons.map((lesson) => {
              const active = selectedLesson.id === lesson.id;
              return (
                <button
                  key={lesson.id}
                  onClick={() => selectLesson(lesson)}
                  className="w-full rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-all duration-150"
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
          className="border-t px-5 py-4"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <p
            className="text-[10px] leading-relaxed"
            style={{ color: "var(--text-sidebar)", opacity: 0.4 }}
          >
            {BUILT_BY}
          </p>
        </div>
      </aside>

      <main
        className="flex h-full min-w-0 flex-1 flex-col overflow-hidden"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="flex flex-none flex-col border-b px-8 pt-6"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="mb-4">
            <h1
              className="mb-0.5 text-[22px] font-semibold leading-tight tracking-tight"
              style={{ fontFamily: "'Lora', serif", color: "var(--text)" }}
            >
              {selectedLesson.title}
            </h1>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              {TAB_SUBTITLE}
            </p>
          </div>
          <Tabs activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-6">
          <div
            className="flex h-full flex-col rounded-xl p-6"
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
