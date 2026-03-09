"use client";
import { useState, useRef, useEffect } from "react";
import { Lesson } from "../data/lessons";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatTab({ lesson }: { lesson: Lesson }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [lesson.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        lessonContent: lesson.content,
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginBottom: "16px",
          paddingRight: "4px",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "14px",
              marginTop: "48px",
            }}
          >
            Ask anything about {lesson.title} ✦
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              maxWidth: "72%",
              fontSize: "14px",
              lineHeight: "1.6",
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background:
                msg.role === "user" ? "var(--accent)" : "var(--surface)",
              color: msg.role === "user" ? "#fff" : "var(--text)",
              border: msg.role === "user" ? "none" : "1px solid var(--border)",
            }}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              maxWidth: "72%",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              fontSize: "14px",
            }}
          >
            Thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            fontSize: "14px",
            color: "var(--text)",
            outline: "none",
            fontFamily: "inherit",
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={`Ask about ${lesson.title}...`}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            padding: "12px 20px",
            borderRadius: "10px",
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            opacity: loading ? 0.5 : 1,
            fontFamily: "inherit",
            transition: "opacity 0.15s",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
