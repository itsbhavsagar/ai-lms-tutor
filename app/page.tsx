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
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 p-4 flex flex-col gap-2 border-r border-gray-800">
        <h2 className="text-lg font-bold mb-4 text-blue-400">📚 Lessons</h2>
        {lessons.map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => selectLesson(lesson)}
            className={`text-left px-4 py-3 rounded-lg transition-all text-sm font-medium ${
              selectedLesson.id === lesson.id
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {lesson.title}
          </button>
        ))}
      </aside>

      {/* Main Content */}
      <main className="flex flex-col flex-1 p-6 overflow-hidden">
        {/* Header */}
        <h1 className="text-2xl font-bold mb-1">🎓 AI LMS Tutor</h1>
        <p className="text-gray-400 text-sm mb-4">
          Currently studying:{" "}
          <span className="text-blue-400 font-semibold">
            {selectedLesson.title}
          </span>
        </p>

        {/* Tabs */}
        <Tabs activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {activeTab === "chat" && <ChatTab lesson={selectedLesson} />}
          {activeTab === "quiz" && <QuizTab lesson={selectedLesson} />}
          {activeTab === "summary" && (
            <SummaryTab lessonTitle={selectedLesson.title} />
          )}
          {activeTab === "notes" && (
            <NotesTab lessonTitle={selectedLesson.title} />
          )}
        </div>
      </main>
    </div>
  );
}
