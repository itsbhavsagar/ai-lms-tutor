"use client";
import { useState, useRef, useEffect } from "react";
import { lessons, Lesson } from "./data/lessons";

type Message = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(lessons[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function selectLesson(lesson: Lesson) {
    setSelectedLesson(lesson);
    setMessages([]); // reset chat on lesson change
    setInput("");
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: updatedMessages,
        lessonContent: selectedLesson.content,
      }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content = buffer;
        return [...updated];
      });
    }

    setLoading(false);
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

      {/* Main Chat */}
      <main className="flex flex-col flex-1 p-6">
        <h1 className="text-2xl font-bold mb-1">🎓 AI LMS Tutor</h1>
        <p className="text-gray-400 text-sm mb-6">
          Currently studying:{" "}
          <span className="text-blue-400 font-semibold">
            {selectedLesson.title}
          </span>
        </p>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 && (
            <div className="text-gray-500 text-sm mt-8 text-center">
              Ask anything about {selectedLesson.title} 👆
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg max-w-[75%] text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white ml-auto"
                  : "bg-gray-800 text-gray-100"
              }`}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="bg-gray-800 text-gray-400 p-3 rounded-lg max-w-[75%] text-sm">
              Thinking...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={`Ask about ${selectedLesson.title}...`}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
          >
            Send
          </button>
        </div>
      </main>
    </div>
  );
}
