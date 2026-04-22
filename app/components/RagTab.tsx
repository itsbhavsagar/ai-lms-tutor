"use client";
import { useState, useRef, useEffect } from "react";
import { Lesson } from "../data/lessons";
import type { ChatMessage } from "../types/chat";
import {
  RiFlashlightLine,
  RiClipboardLine,
  RiFilePdf2Line,
  RiSendPlane2Line,
  RiUploadCloud2Line,
} from "react-icons/ri";
import { getOrCreateUserId } from "@/lib/utils/localStorage";
import MessageContent from "./MessageContent";

type InputMode = "paste" | "pdf";

const LABEL_PASTE = "Paste Text";
const LABEL_PDF = "Upload PDF";
const LABEL_INDEX = "Index & Enable RAG Chat";
const LABEL_INDEXING = "Indexing…";
const LABEL_ASK = "Ask";
const LABEL_RE_INDEX = "Re-index";
const LABEL_EMPTY_CHAT = "Ask anything from your indexed content";
const LABEL_CHUNKS = "chunks indexed";
const LABEL_FROM_PAGES = "from";
const LABEL_PAGES = "pages";
const LABEL_RAG_ACTIVE = "RAG active";
const LABEL_HEADING = "RAG Chat";
const LABEL_SUBHEADING =
  "Index your content, then chat with it using semantic retrieval.";
const LABEL_PASTE_HINT = "Paste lecture notes, textbook content, articles…";
const LABEL_PDF_CLICK = "Click to upload a PDF";
const LABEL_PDF_HINT = "Lecture notes, textbooks, research papers";
const LABEL_PDF_CHANGE = "click to change";
const PLACEHOLDER_INPUT = "Ask from your indexed content…";
const LABEL_RETRIEVING = "Retrieving relevant chunks…";

export default function RagTab({ lesson }: { lesson: Lesson }) {
  const [mode, setMode] = useState<InputMode>("paste");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [indexed, setIndexed] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [chunksCreated, setChunksCreated] = useState(0);
  const [pages, setPages] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const lastMessage = messages[messages.length - 1]?.content;

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
  }, [lastMessage]);

  async function handleIndex() {
    setIndexing(true);
    if (mode === "paste") {
      const res = await fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          lessonId: lesson.id,
          userId: getOrCreateUserId(),
        }),
      });
      const data = await res.json();
      setChunksCreated(data.chunksCreated);
    } else if (mode === "pdf" && file) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("lessonId", lesson.id);
      fd.append("userId", getOrCreateUserId());
      const res = await fetch("/api/upload-pdf", { method: "POST", body: fd });
      const data = await res.json();
      setChunksCreated(data.chunksCreated);
      setPages(data.pages);
    }
    setIndexed(true);
    setIndexing(false);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    setMessages((p) => [...p, { role: "assistant", content: "" }]);

    const res = await fetch("/api/rag-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: history,
        lessonId: lesson.id,
        userId: getOrCreateUserId(),
      }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      setMessages((p) => {
        const u = [...p];
        u[u.length - 1] = { ...u[u.length - 1], content: buffer };
        return [...u];
      });
    }
    setLoading(false);
  }

  const canIndex = mode === "paste" ? text.trim().length > 0 : file !== null;

  const statusText = `✓ ${chunksCreated} ${LABEL_CHUNKS}${pages > 0 ? ` ${LABEL_FROM_PAGES} ${pages} ${LABEL_PAGES}` : ""} — ${LABEL_RAG_ACTIVE}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {!indexed ? (
        <>
          <div className="flex min-w-0 flex-none flex-col gap-0.5">
            <h2
              className="text-[15px] font-semibold"
              style={{ color: "var(--text)" }}
            >
              {LABEL_HEADING}
            </h2>
            <p
              className="break-words text-[12px]"
              style={{ color: "var(--text-muted)" }}
            >
              {LABEL_SUBHEADING}
            </p>
          </div>

          <div className="flex flex-none flex-wrap gap-2">
            {(["paste", "pdf"] as InputMode[]).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-medium transition-all sm:flex-none"
                  style={{
                    background: active ? "var(--accent)" : "var(--bg)",
                    color: active ? "#fff" : "var(--text-muted)",
                    border: `1px solid ${active ? "var(--accent)" : "var(--border-strong)"}`,
                  }}
                >
                  {m === "paste" ? (
                    <RiClipboardLine size={13} />
                  ) : (
                    <RiFilePdf2Line size={13} />
                  )}
                  {m === "paste" ? LABEL_PASTE : LABEL_PDF}
                </button>
              );
            })}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {mode === "paste" && (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={LABEL_PASTE_HINT}
                className="h-full w-full min-w-0 resize-none rounded-xl border p-4 text-[13px] leading-relaxed outline-none transition-colors sm:p-5"
                style={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text)",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--accent)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border-strong)")
                }
              />
            )}

            {mode === "pdf" && (
              <div
                onClick={() => fileRef.current?.click()}
                className="flex h-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-all"
                style={{
                  borderColor: file ? "var(--accent)" : "var(--border-strong)",
                  background: file
                    ? "var(--accent-soft)"
                    : "var(--surface-raised)",
                }}
              >
                <RiUploadCloud2Line
                  size={32}
                  style={{
                    color: file ? "var(--accent)" : "var(--text-muted)",
                    opacity: 0.6,
                  }}
                />
                {file ? (
                  <>
                    <p
                      className="max-w-full break-words text-[13px] font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {file.name}
                    </p>
                    <p
                      className="break-words text-[11px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {(file.size / 1024).toFixed(1)} KB — {LABEL_PDF_CHANGE}
                    </p>
                  </>
                ) : (
                  <>
                    <p
                      className="break-words text-[13px] font-medium"
                      style={{ color: "var(--text)" }}
                    >
                      {LABEL_PDF_CLICK}
                    </p>
                    <p
                      className="break-words text-[11px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {LABEL_PDF_HINT}
                    </p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            )}
          </div>

          <button
            onClick={handleIndex}
            disabled={!canIndex || indexing}
            className="flex w-full flex-none items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity sm:w-auto sm:self-start"
            style={{
              background: "var(--accent)",
              opacity: !canIndex || indexing ? 0.45 : 1,
              cursor: !canIndex || indexing ? "not-allowed" : "pointer",
            }}
          >
            <RiFlashlightLine size={14} />
            {indexing ? LABEL_INDEXING : LABEL_INDEX}
          </button>
        </>
      ) : (
        <>
          <div
            className="flex flex-none flex-col gap-2 rounded-xl px-4 py-2.5 text-[12px] font-medium sm:flex-row sm:items-center sm:justify-between"
            style={{
              background: "var(--green-soft)",
              color: "var(--green)",
              border: "1px solid var(--green-border)",
            }}
          >
            <span className="min-w-0 break-words">{statusText}</span>
            <button
              onClick={() => {
                setIndexed(false);
                setFile(null);
              }}
              className="underline"
              style={{
                color: "var(--green)",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              {LABEL_RE_INDEX}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-0 sm:pr-1">
            <div className="flex flex-col gap-3 pb-2">
              {messages.length === 0 && (
                <div
                  className="mt-16 flex flex-col items-center gap-3 text-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  <RiFlashlightLine size={32} style={{ opacity: 0.35 }} />
                  <p className="text-[13px]">{LABEL_EMPTY_CHAT}</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className="msg-in flex min-w-0"
                  style={{
                    justifyContent:
                      msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  {msg.role === "assistant" && (
                    <div
                      className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: "var(--accent)" }}
                    >
                      A
                    </div>
                  )}
                  <div
                    className="min-w-0 max-w-[88%] break-words rounded-2xl px-3 py-2.5 text-[13px] leading-relaxed sm:max-w-[78%] sm:px-4 lg:max-w-[72%]"
                    style={
                      msg.role === "user"
                        ? {
                            background: "var(--text)",
                            color: "#fff",
                            borderBottomRightRadius: 4,
                          }
                        : {
                            background: "var(--accent-soft)",
                            color: "var(--text)",
                            border: "1px solid var(--accent-border)",
                            borderBottomLeftRadius: 4,
                          }
                    }
                  >
                    {msg.content === "" ? (
                      <span className="flex items-center gap-1 py-0.5">
                        <span className="dot dot-1" />
                        <span className="dot dot-2" />
                        <span className="dot dot-3" />
                      </span>
                    ) : msg.role === "assistant" &&
                      loading &&
                      i === messages.length - 1 ? (
                      <div className="space-y-2 break-words">
                        <MessageContent content={msg.content} />
                        <span style={{ color: "var(--text-muted)" }}>
                          {LABEL_RETRIEVING}
                        </span>
                      </div>
                    ) : msg.role === "assistant" ? (
                      <MessageContent content={msg.content} />
                    ) : (
                      <span className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          <div
            className="flex-none border-t pt-4"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                className="min-h-10 w-full min-w-0 flex-1 rounded-xl border px-4 py-2.5 text-[13px] outline-none"
                style={{
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg)",
                  color: "var(--text)",
                }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={PLACEHOLDER_INPUT}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl px-4 text-[13px] font-semibold text-white transition-opacity sm:w-auto"
                style={{
                  background: "var(--accent)",
                  opacity: loading || !input.trim() ? 0.45 : 1,
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                }}
              >
                <RiSendPlane2Line size={14} />
                {LABEL_ASK}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
