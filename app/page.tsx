"use client";
import { useState } from "react";
import { lessons, Lesson } from "./data/lessons";
import Tabs, { TabType } from "./components/Tabs";
import ChatTab from "./components/ChatTab";
import QuizTab from "./components/QuizTab";
import SummaryTab from "./components/SummaryTab";
import NotesTab from "./components/NotesTab";

export default function Home() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(lessons[0]);
  const [activeTab, setActiveTab] = useState<TabType>("chat");

  function selectLesson(lesson: Lesson) {
    setSelectedLesson(lesson);
    setActiveTab("chat");
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "260px",
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          padding: "28px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          flexShrink: 0,
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            padding: "0 12px",
            marginBottom: "12px",
          }}
        >
          Lessons
        </p>
        {lessons.map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => selectLesson(lesson)}
            style={{
              textAlign: "left",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: selectedLesson.id === lesson.id ? 600 : 400,
              background:
                selectedLesson.id === lesson.id
                  ? "var(--accent-soft)"
                  : "transparent",
              color:
                selectedLesson.id === lesson.id
                  ? "var(--accent)"
                  : "var(--text)",
              transition: "all 0.15s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              if (selectedLesson.id !== lesson.id)
                (e.target as HTMLElement).style.background = "var(--surface2)";
            }}
            onMouseLeave={(e) => {
              if (selectedLesson.id !== lesson.id)
                (e.target as HTMLElement).style.background = "transparent";
            }}
          >
            {lesson.title}
          </button>
        ))}
      </aside>

      {/* Main */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          padding: "32px 40px",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontFamily: "Instrument Serif, serif",
              fontSize: "28px",
              fontWeight: 400,
              color: "var(--text)",
              marginBottom: "4px",
            }}
          >
            {selectedLesson.title}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            AI-powered learning — ask questions, take quizzes, and review
            summaries
          </p>
        </div>

        {/* Tabs */}
        <Tabs activeTab={activeTab} onChange={setActiveTab} />

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {activeTab === "chat" && <ChatTab lesson={selectedLesson} />}
          {activeTab === "quiz" && <QuizTab lesson={selectedLesson} />}
          {activeTab === "summary" && <SummaryTab lesson={selectedLesson} />}
          {activeTab === "notes" && <NotesTab lesson={selectedLesson} />}
        </div>
      </main>
    </div>
  );
}
