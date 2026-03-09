"use client";
import { useState, useRef, useEffect } from "react";
import { Lesson } from "../data/lessons";

type Message = { role: "user" | "assistant"; content: string };
type InputMode = "paste" | "pdf";

export default function RagTab({ lesson }: { lesson: Lesson }) {
  const [mode, setMode] = useState<InputMode>("paste");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [indexed, setIndexed] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [chunksCreated, setChunksCreated] = useState(0);
  const [pages, setPages] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIndexed(false);
    setText("");
    setFile(null);
    setMessages([]);
    setChunksCreated(0);
    setPages(0);
  }, [lesson.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleIndex() {
    setIndexing(true);

    if (mode === "paste") {
      const res = await fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lessonId: lesson.id }),
      });
      const data = await res.json();
      setChunksCreated(data.chunksCreated);
    } else if (mode === "pdf" && file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("lessonId", lesson.id);

      const res = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setChunksCreated(data.chunksCreated);
      setPages(data.pages);
    }

    setIndexed(true);
    setIndexing(false);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const res = await fetch("/api/rag-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: updatedMessages, lessonId: lesson.id }),
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

  const canIndex = mode === "paste" ? text.trim().length > 0 : file !== null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
      }}
    >
      {!indexed ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: "16px",
          }}
        >
          {/* Mode Toggle */}
          <div style={{ display: "flex", gap: "8px" }}>
            {(["paste", "pdf"] as InputMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: "7px 16px",
                  borderRadius: "7px",
                  border: "1px solid var(--border)",
                  background: mode === m ? "var(--accent)" : "var(--surface)",
                  color: mode === m ? "#fff" : "var(--text-muted)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                {m === "paste" ? "📋 Paste Text" : "📄 Upload PDF"}
              </button>
            ))}
          </div>

          {/* Paste Mode */}
          {mode === "paste" && (
            <>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Paste any text — lecture notes, textbook content, articles.
              </p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste lesson content here..."
                style={{
                  flex: 1,
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  fontFamily: "inherit",
                  resize: "none",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </>
          )}

          {/* PDF Mode */}
          {mode === "pdf" && (
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                flex: 1,
                border: "2px dashed var(--border)",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                gap: "12px",
                background: file ? "var(--accent-soft)" : "var(--surface)",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "var(--accent)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            >
              <p style={{ fontSize: "32px" }}>📄</p>
              {file ? (
                <>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--accent)",
                    }}
                  >
                    {file.name}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {(file.size / 1024).toFixed(1)} KB — click to change
                  </p>
                </>
              ) : (
                <>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--text)",
                    }}
                  >
                    Click to upload a PDF
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Lecture notes, textbooks, research papers
                  </p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          )}

          {/* Index Button */}
          <button
            onClick={handleIndex}
            disabled={!canIndex || indexing}
            style={{
              padding: "11px 24px",
              borderRadius: "8px",
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 500,
              cursor: !canIndex ? "not-allowed" : "pointer",
              opacity: !canIndex || indexing ? 0.5 : 1,
              fontFamily: "inherit",
              alignSelf: "flex-start",
              transition: "opacity 0.15s",
            }}
          >
            {indexing ? "Indexing..." : "⚡ Index & Enable RAG Chat"}
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflow: "hidden",
          }}
        >
          {/* Success Banner */}
          <div
            style={{
              background: "var(--green-soft)",
              border: "1px solid var(--green)",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "16px",
              fontSize: "13px",
              color: "var(--green)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              ✓ {chunksCreated} chunks indexed
              {pages > 0 ? ` from ${pages} pages` : ""} — RAG is active
            </span>
            <button
              onClick={() => {
                setIndexed(false);
                setFile(null);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--green)",
                fontSize: "12px",
                cursor: "pointer",
                textDecoration: "underline",
                fontFamily: "inherit",
              }}
            >
              Re-index
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "16px",
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
                Ask anything from your indexed content ✦
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
                  border:
                    msg.role === "user" ? "none" : "1px solid var(--border)",
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
                Retrieving relevant chunks...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
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
              placeholder="Ask from your indexed content..."
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
              }}
            >
              Ask
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
