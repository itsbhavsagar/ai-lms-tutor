"use client";
import { useEffect, useState, useRef } from "react";
import { Lesson } from "../data/lessons";
import type { ChatMessage } from "../types/chat";
import {
  RiFlashlightLine,
  RiClipboardLine,
  RiFilePdf2Line,
  RiSendPlane2Line,
  RiUploadCloud2Line,
} from "react-icons/ri";
import { getClientErrorMessage, readTextStream } from "@/lib/api/client";
import { streamRagChat } from "@/lib/api/rag";
import {
  useRagIndexMutation,
  useRagIndexQuery,
  useResetRagIndexMutation,
} from "@/lib/hooks/queries/useRag";
import { showError } from "@/lib/utils/toast";
import { getOrCreateUserId } from "@/lib/utils/localStorage";
import MessageContent from "./MessageContent";
import ChatThinkingIndicator from "./chat/ChatThinkingIndicator";
import EmptyState from "./ui/EmptyState";
import PrimaryButton from "./ui/PrimaryButton";
import { btnInteractive, inputFieldClass, panelHeadingClass, panelSubtextClass, raisedFieldClass, scrollAreaClass } from "@/lib/ui/styles";

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
  const { data: ragIndex } = useRagIndexQuery(lesson.id);
  const indexMutation = useRagIndexMutation(lesson.id);
  const resetMutation = useResetRagIndexMutation(lesson.id);

  const [mode, setMode] = useState<InputMode>("paste");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const indexed = ragIndex?.indexed ?? false;
  const chunksCreated = ragIndex?.chunksCreated ?? 0;
  const pages = ragIndex?.pages ?? 0;
  const indexing = indexMutation.isPending;
  const lastMessage = messages[messages.length - 1]?.content;

  useEffect(() => {
    setText("");
    setFile(null);
    setMessages([]);
    setInput("");
  }, [lesson.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastMessage]);

  function handleIndex() {
    if (mode === "paste") {
      indexMutation.mutate({ mode: "paste", text });
      return;
    }
    if (file) {
      indexMutation.mutate({ mode: "pdf", file });
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    setMessages((p) => [...p, { role: "assistant", content: "" }]);

    try {
      const response = await streamRagChat(
        history,
        lesson.id,
        getOrCreateUserId(),
      );

      await readTextStream(response, (buffer) => {
        setMessages((p) => {
          const u = [...p];
          u[u.length - 1] = { ...u[u.length - 1], content: buffer };
          return u;
        });
      });
    } catch (error) {
      console.error("RAG chat error:", error);
      showError(getClientErrorMessage(error, "RAG chat failed"));
      setMessages((p) => p.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function handleReIndex() {
    resetMutation.mutate(undefined, {
      onSuccess: () => {
        setFile(null);
        setMessages([]);
      },
    });
  }

  const canIndex = mode === "paste" ? text.trim().length > 0 : file !== null;

  const statusText = `✓ ${chunksCreated} ${LABEL_CHUNKS}${pages > 0 ? ` ${LABEL_FROM_PAGES} ${pages} ${LABEL_PAGES}` : ""} — ${LABEL_RAG_ACTIVE}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {!indexed ? (
        <>
          <div className="flex min-w-0 flex-none flex-col gap-0.5">
            <h2 className={panelHeadingClass}>
              {LABEL_HEADING}
            </h2>
            <p className={`wrap-wrap-wrap-break-word ${panelSubtextClass}`}>
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
                  className={`${btnInteractive} flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-[13px] font-medium sm:flex-none ${
                    active
                      ? "border-accent bg-accent text-on-accent"
                      : "border-border-strong bg-surface-raised text-muted"
                  }`}
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
                className={`${raisedFieldClass} h-full w-full min-w-0 resize-none rounded-xl p-4 text-[13px] leading-relaxed transition-colors focus:border-accent sm:p-5`}
              />
            )}

            {mode === "pdf" && (
              <div
                onClick={() => fileRef.current?.click()}
                className={`flex h-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-all ${
                  file
                    ? "border-accent bg-accent-soft"
                    : "border-border-strong bg-surface-raised"
                }`}
              >
                <RiUploadCloud2Line
                  size={32}
                  className={`opacity-60 ${file ? "text-accent" : "text-muted"}`}
                />
                {file ? (
                  <>
                    <p className="max-w-full wrap-wrap-break-word text-[13px] font-semibold text-ink">
                      {file.name}
                    </p>
                    <p className="wrap-wrap-break-word text-[11px] text-muted">
                      {(file.size / 1024).toFixed(1)} KB — {LABEL_PDF_CHANGE}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="wrap-wrap-break-word text-[13px] font-medium text-ink">
                      {LABEL_PDF_CLICK}
                    </p>
                    <p className="wrap-wrap-break-word text-[11px] text-muted">
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

          <PrimaryButton
            onClick={handleIndex}
            disabled={!canIndex || indexing}
            fullWidth
            className="sm:self-start"
          >
            <RiFlashlightLine size={14} />
            {indexing ? LABEL_INDEXING : LABEL_INDEX}
          </PrimaryButton>
        </>
      ) : (
        <>
          <div className="flex flex-none flex-col gap-2 rounded-xl border border-green-border bg-green-soft px-4 py-2.5 text-[12px] font-medium text-green sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0 wrap-wrap-break-word">{statusText}</span>
            <button
              onClick={handleReIndex}
              className="cursor-pointer bg-transparent text-green underline"
            >
              {LABEL_RE_INDEX}
            </button>
          </div>

          <div className={`${scrollAreaClass} pr-0 sm:pr-1`}>
            <div className="flex flex-col gap-3 pb-2">
              {messages.length === 0 && (
                <EmptyState
                  icon={<RiFlashlightLine size={22} />}
                  title="Ready to chat"
                  description={LABEL_EMPTY_CHAT}
                  fill
                />
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`msg-in flex min-w-0 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-on-accent">
                      A
                    </div>
                  )}
                  <div
                    className={`min-w-0 max-w-[88%] wrap-wrap-break-word rounded-2xl px-3 py-2.5 text-[13px] leading-relaxed sm:max-w-[78%] sm:px-4 lg:max-w-[72%] ${
                      msg.role === "user"
                        ? "rounded-br-sm bg-chat-user text-chat-user-fg"
                        : "rounded-bl-sm border border-accent-border bg-accent-soft text-ink"
                    }`}
                  >
                    {msg.content === "" ? (
                      <ChatThinkingIndicator label="Answering" />
                    ) : msg.role === "assistant" &&
                      loading &&
                      i === messages.length - 1 ? (
                      <div className="space-y-2 wrap-wrap-break-word">
                        <MessageContent content={msg.content} />
                        <span className="text-muted">
                          {LABEL_RETRIEVING}
                        </span>
                      </div>
                    ) : msg.role === "assistant" ? (
                      <MessageContent content={msg.content} />
                    ) : (
                      <span className="whitespace-pre-wrap wrap-wrap-break-word">
                        {msg.content}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="flex-none border-t border-border pt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                className={`${inputFieldClass} min-h-10 w-full min-w-0 flex-1 rounded-xl px-4 py-2.5 text-[13px]`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={PLACEHOLDER_INPUT}
              />
              <PrimaryButton
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                fullWidth
              >
                <RiSendPlane2Line size={14} />
                {LABEL_ASK}
              </PrimaryButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
