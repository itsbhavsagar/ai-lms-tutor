"use client";
import { useState, useRef, useEffect, useCallback } from "react";
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
const HOLD_TO_RECORD_LABEL = "Hold to record voice";
const RELEASE_TO_STOP_LABEL = "Release when you are done";
const MIC_DENIED_MSG = "Microphone access denied.";

export default function ChatTab({ lesson }: { lesson: Lesson }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [showMicHint, setShowMicHint] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  useEffect(() => {
    setMessages([]);
    setInput("");
    setSessionId(null);
    setCursor(null);
    setHasMore(true);
    setLoadingMore(false);
  }, [lesson.id]);
  useEffect(() => {
    if (!shouldAutoScroll) return;

    const container = messagesContainerRef.current;

    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [messages, shouldAutoScroll]);

  useEffect(() => {
    if (!sessionId) return;

    async function loadMessages() {
      const res = await fetch(`/api/messages?sessionId=${sessionId}`);
      const data = await res.json();

      if (data.messages?.length) {
        setMessages(data.messages);
        setCursor(data.nextCursor);
        setHasMore(data.nextCursor !== null);
        setShouldAutoScroll(true);
      } else {
        setMessages([]);
        setCursor(null);
        setHasMore(false);
      }
    }

    loadMessages();
  }, [sessionId]);

  const loadMoreMessages = useCallback(async () => {
    if (!cursor || !hasMore || loadingMore || !sessionId) return;
    setShouldAutoScroll(false);
    setLoadingMore(true);
    const container = messagesContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;

    try {
      const res = await fetch(
        `/api/messages?sessionId=${sessionId}&cursor=${cursor}`,
      );
      const data = await res.json();

      if (data.messages?.length) {
        setMessages((prev) => [...data.messages, ...prev]);
        setCursor(data.nextCursor);
        setHasMore(data.nextCursor !== null);

        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            const scrollDiff = newScrollHeight - prevScrollHeight;
            container.scrollTop += scrollDiff;
          }
        }, 0);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, hasMore, loadingMore, sessionId]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Load more when scrolled to within 100px of the top
    if (container.scrollTop <= 100) {
      loadMoreMessages();
    }
  }, [loadMoreMessages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : "";
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const actualType = mr.mimeType || mimeType || "audio/webm";
        const audioBlob = new Blob(chunksRef.current, { type: actualType });
        await transcribeAudio(audioBlob);
      };
      mr.start(250);
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

    createNewSession();

    async function createNewSession() {
      try {
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
      } catch (error) {
        console.error("Failed to create session:", error);
      }
    }
  }, [lesson.id, lesson.title]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setTranscribing(true);
    }
    setShowMicHint(false);
  }, [recording]);

  useEffect(() => {
    if (!recording) return;

    const stopOnRelease = () => stopRecording();

    window.addEventListener("mouseup", stopOnRelease);
    window.addEventListener("touchend", stopOnRelease);
    window.addEventListener("touchcancel", stopOnRelease);

    return () => {
      window.removeEventListener("mouseup", stopOnRelease);
      window.removeEventListener("touchend", stopOnRelease);
      window.removeEventListener("touchcancel", stopOnRelease);
    };
  }, [recording, stopRecording]);

  useEffect(() => {
    if (!recording) {
      setRecordingSeconds(0);
      return;
    }

    const timer = window.setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [recording]);

  async function transcribeAudio(blob: Blob) {
    try {
      if (blob.size === 0) {
        alert("No audio captured. Hold the mic button slightly longer and try again.");
        return;
      }

      const fd = new FormData();
      const ext = blob.type.includes("mp4")
        ? "mp4"
        : blob.type.includes("wav")
          ? "wav"
          : blob.type.includes("ogg")
            ? "ogg"
            : "webm";
      fd.append(
        "audio",
        blob,
        `recording.${ext}`,
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
    if (!input.trim() || loading) return;

    let currentSessionId = sessionId;
    if (!currentSessionId) {
      try {
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
        currentSessionId = data.session.id;
        setSessionId(currentSessionId);
        localStorage.setItem(`sessionId_${lesson.id}`, currentSessionId!);
      } catch (error) {
        console.error("Failed to create session:", error);
        return;
      }
    }

    const userMsg: ChatMessage = { role: "user", content: input };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    setMessages((p) => [...p, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          sessionId: currentSessionId,
          lessonContent: lesson.content,
        }),
      });

      if (res.status === 404) {
        const createRes = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: getOrCreateUserId(),
            lessonId: lesson.id,
            title: lesson.title,
          }),
        });
        const createData = await createRes.json();
        const newSessionId = createData.session.id;
        setSessionId(newSessionId);
        localStorage.setItem(`sessionId_${lesson.id}`, newSessionId);

        const retryRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            sessionId: newSessionId,
            lessonContent: lesson.content,
          }),
        });

        if (!retryRes.ok) {
          throw new Error(`Chat failed: ${retryRes.status}`);
        }

        const reader = retryRes.body!.getReader();
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
      } else if (!res.ok) {
        throw new Error(`Chat failed: ${res.status}`);
      } else {
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
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((p) => {
        const u = [...p];
        u[u.length - 1] = {
          ...u[u.length - 1],
          content: "Sorry, I encountered an error. Please try again.",
        };
        return [...u];
      });
    }

    setLoading(false);
  }

  function formatRecordingTime(totalSeconds: number) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={messagesContainerRef}
        className="min-h-0 flex-1 overflow-y-auto pr-1"
      >
        <div className="flex flex-col gap-3 pb-2">
          {loadingMore && (
            <div className="flex justify-center py-2">
              <div
                className="flex items-center gap-2 text-[12px]"
                style={{ color: "var(--text-muted)" }}
              >
                <span className="dot dot-1" />
                <span className="dot dot-2" />
                <span className="dot dot-3" />
                Loading older messages...
              </div>
            </div>
          )}
          {messages.length === 0 && !loadingMore && (
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

          <div className="relative">
            <div
              className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 rounded-lg px-2.5 py-1 text-[11px] whitespace-nowrap transition-all duration-200"
              style={{
                background: recording ? "var(--red-soft)" : "var(--accent-soft)",
                border: `1px solid ${recording ? "var(--red-border)" : "var(--accent-border)"}`,
                color: recording ? "var(--red)" : "var(--text)",
                opacity: recording || showMicHint ? 1 : 0,
                transform: `translateX(-50%) translateY(${recording || showMicHint ? "0px" : "4px"})`,
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                {recording && (
                  <span
                    className="rec-pulse inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--red)" }}
                  />
                )}
                {recording
                  ? `${RELEASE_TO_STOP_LABEL} • ${formatRecordingTime(recordingSeconds)}`
                  : HOLD_TO_RECORD_LABEL}
              </span>
            </div>

            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onMouseEnter={() => setShowMicHint(true)}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              onTouchCancel={stopRecording}
              onBlur={() => setShowMicHint(false)}
              onFocus={() => setShowMicHint(true)}
              aria-label={recording ? RELEASE_TO_STOP_LABEL : HOLD_TO_RECORD_LABEL}
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
          </div>

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
