"use client";
import { useState, useRef, useEffect } from "react";
import { Lesson } from "../data/lessons";
import type { ChatMessage } from "../types/chat";
import { getOrCreateUserId } from "../../lib/utils/localStorage";
import {
  RiSendPlane2Line,
  RiMicLine,
  RiStopCircleLine,
  RiChatSmile2Line,
} from "react-icons/ri";

const PLACEHOLDER_SUFFIX = "…";
const SEND_LABEL = "Send";
const TRANSCRIBING_LABEL = "Transcribing…";
const RECORDING_LABEL = "Recording — release to stop";
const MIC_DENIED_MSG = "Microphone access denied.";

export default function ChatTab({ lesson }: { lesson: Lesson }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setMessages([]);
    setInput("");
    setSessionId(null); // Reset session when lesson changes
  }, [lesson.id]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!sessionId) return;

    async function loadMessages() {
      const res = await fetch(`/api/messages?sessionId=${sessionId}`);
      const data = await res.json();

      if (data.messages?.length) {
        setMessages(data.messages);
      }
    }

    loadMessages();
  }, [sessionId]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/wav")
        ? "audio/wav"
        : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await transcribeAudio(new Blob(chunksRef.current, { type: mimeType }));
      };
      mr.start();
      setRecording(true);
    } catch {
      alert(MIC_DENIED_MSG);
    }
  }

  useEffect(() => {
    const sessionKey = `sessionId_${lesson.id}`;
    const existing = localStorage.getItem(sessionKey);

    if (existing) {
      setSessionId(existing);
      return;
    }

    async function createSession() {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: getOrCreateUserId(),
          lessonId: lesson.id,
          title: lesson.title,
        }),
      });

      const data = await res.json();

      setSessionId(data.session.id);
      localStorage.setItem(sessionKey, data.session.id);
    }

    createSession();
  }, [lesson.id]);

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setTranscribing(true);
    }
  }

  async function transcribeAudio(blob: Blob) {
    try {
      const fd = new FormData();
      fd.append(
        "audio",
        blob,
        `recording.${blob.type.includes("wav") ? "wav" : "webm"}`,
      );
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      if (data.text) setInput(data.text);
    } catch {
    } finally {
      setTranscribing(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading || !sessionId) return;
    const userMsg: ChatMessage = { role: "user", content: input };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    setMessages((p) => [...p, { role: "assistant", content: "" }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: history,
        sessionId,
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
      setMessages((p) => {
        const u = [...p];
        u[u.length - 1] = { ...u[u.length - 1], content: buffer };
        return [...u];
      });
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-3 pb-2">
          {messages.length === 0 && (
            <div
              className="mt-16 flex flex-col items-center gap-3 text-center"
              style={{ color: "var(--text-muted)" }}
            >
              <RiChatSmile2Line size={32} style={{ opacity: 0.4 }} />
              <p className="text-[13px]">
                Ask anything about{" "}
                <span className="font-medium" style={{ color: "var(--text)" }}>
                  {lesson.title}
                </span>
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className="msg-in flex"
              style={{
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
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
                className="max-w-[72%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed"
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
                ) : (
                  msg.content
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
        {recording && (
          <p
            className="mb-2 flex items-center gap-1.5 text-[12px]"
            style={{ color: "var(--red)" }}
          >
            <span
              className="rec-pulse inline-block h-2 w-2 rounded-full"
              style={{ background: "var(--red)" }}
            />
            {RECORDING_LABEL}
          </p>
        )}

        <div className="flex items-center gap-2">
          <input
            className="flex-1 rounded-xl border px-4 py-2.5 text-[13px] outline-none transition-colors"
            style={{
              border: "1px solid var(--border-strong)",
              background: "var(--bg)",
              color: "var(--text)",
            }}
            value={transcribing ? TRANSCRIBING_LABEL : input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={`Ask about ${lesson.title}${PLACEHOLDER_SUFFIX}`}
            disabled={transcribing}
          />

          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={transcribing}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all"
            style={{
              background: recording ? "var(--red-soft)" : "var(--bg)",
              border: `1px solid ${recording ? "var(--red-border)" : "var(--border-strong)"}`,
              color: recording ? "var(--red)" : "var(--text-muted)",
              opacity: transcribing ? 0.5 : 1,
              cursor: transcribing ? "not-allowed" : "pointer",
            }}
          >
            {recording ? (
              <RiStopCircleLine size={16} />
            ) : (
              <RiMicLine size={16} />
            )}
          </button>

          <button
            onClick={sendMessage}
            disabled={loading || transcribing || !input.trim() || !sessionId}
            className="flex h-10 items-center gap-1.5 rounded-xl px-4 text-[13px] font-semibold text-white transition-opacity"
            style={{
              background: "var(--accent)",
              opacity: loading || transcribing || !input.trim() ? 0.45 : 1,
              cursor:
                loading || transcribing || !input.trim()
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            <RiSendPlane2Line size={14} />
            {SEND_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
}
