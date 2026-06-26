"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Lesson } from "../data/lessons";
import type { ChatMessage } from "../types/chat";
import { getClientErrorMessage } from "@/lib/api/client";
import { streamLessonChatWithRetry } from "@/lib/api/chat";
import { showError, showSuccess } from "@/lib/utils/toast";
import { useUserId } from "@/lib/hooks/useUserId";
import {
  flattenMessages,
  readCachedMessages,
  useCreateSessionMutation,
  useMessagesQuery,
  useUpdateMessagesCache,
} from "@/lib/hooks/queries/useMessages";
import {
  useDeleteSessionMutation,
  useSessionsQuery,
} from "@/lib/hooks/queries/useSessions";
import { useTranscribeMutation } from "@/lib/hooks/queries/useTranscribe";
import { sessionPreviewText } from "@/lib/chat/format";
import { chatBtnClass } from "@/lib/chat/interactive";
import {
  persistLessonSessionId,
  readLessonSessionId,
  clearLessonSessionId,
} from "@/lib/chat/sessionStorage";
import { queryKeys } from "@/lib/query/keys";
import ChatEmptyState from "./chat/ChatEmptyState";
import ChatSidebar, {
  confirmDeleteSession,
  dismissDeleteSessionToast,
} from "./chat/ChatSidebar";
import ChatMessageBubble from "./chat/ChatMessageBubble";
import LoadingIndicator from "./ui/LoadingIndicator";
import { SkeletonChatHistory } from "./ui/Skeleton";
import {
  RiSendPlane2Line,
  RiMicLine,
  RiStopCircleLine,
  RiMenuLine,
  RiAddLine,
} from "react-icons/ri";

const PLACEHOLDER_SUFFIX = "…";
const SEND_LABEL = "Send";
const TRANSCRIBING_LABEL = "Transcribing…";
const HOLD_TO_RECORD_LABEL = "Hold to record voice";
const RELEASE_TO_STOP_LABEL = "Release when you are done";
const MIC_DENIED_MSG = "Microphone access denied.";

type StreamPhase = "idle" | "thinking" | "streaming";

export default function ChatTab({ lesson }: { lesson: Lesson }) {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const { mutateAsync: createSessionAsync } = useCreateSessionMutation(
    lesson.id,
  );
  const transcribeMutation = useTranscribeMutation();
  const { data: sessionsData, isSuccess: sessionsLoaded } =
    useSessionsQuery(lesson.id);
  const deleteSessionMutation = useDeleteSessionMutation(lesson.id);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamPhase, setStreamPhase] = useState<StreamPhase>("idle");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [showMicHint, setShowMicHint] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sessions = sessionsData?.sessions ?? [];
  const savedSessions = sessions.filter((session) => session.messageCount > 0);
  const sessionIdsKey = savedSessions.map((session) => session.id).join(",");

  const messagesQuery = useMessagesQuery(sessionId);
  const updateMessagesCache = useUpdateMessagesCache(sessionId);

  const loadingMore = messagesQuery.isFetchingNextPage;
  const hasMore = messagesQuery.hasNextPage ?? false;

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const resizeInput = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    resizeInput();
  }, [input, transcribing, resizeInput]);

  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const isLoadingHistory =
    !!sessionId &&
    messages.length === 0 &&
    !loading &&
    (messagesQuery.isLoading || messagesQuery.isFetching);

  const showEmptyState =
    !sessionId && !loading && streamPhase === "idle" && !isLoadingHistory;

  useEffect(() => {
    setMessages([]);
    setInput("");
    setSessionId(null);
    setStreamPhase("idle");
    setSidebarOpen(false);
  }, [lesson.id]);

  useEffect(() => {
    if (!sessionsLoaded) return;

    const savedId = readLessonSessionId(lesson.id);

    if (!sessionIdsKey) {
  
      if (savedId && sessionId === savedId) return;
      if (savedId) clearLessonSessionId(lesson.id);
      return;
    }

    if (!savedId) return;

    if (sessionIdsKey.split(",").includes(savedId)) {
      if (sessionId !== savedId) {
        setSessionId(savedId);
      }
    } else {
      clearLessonSessionId(lesson.id);
    }
  }, [lesson.id, sessionsLoaded, sessionIdsKey, sessionId]);

  useEffect(() => {
    if (!sessionId && !loading && streamPhase === "idle") {
      setMessages([]);
    }
  }, [sessionId, loading, streamPhase]);

  useEffect(() => {
    if (!sessionId || loading || streamPhase !== "idle") return;
    if (messages.length > 0) return;
    if (!messagesQuery.isSuccess) return;

    const fromQuery = flattenMessages(messagesQuery.data);
    if (fromQuery.length > 0) {
      setMessages(fromQuery);
    }
  }, [
    sessionId,
    messagesQuery.data,
    messagesQuery.isSuccess,
    loading,
    streamPhase,
    messages.length,
  ]);

  useEffect(() => {
    if (!shouldAutoScroll) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [messages, shouldAutoScroll, streamPhase]);

  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;
    if (!userId) return null;

    const created = await createSessionAsync({
      userId,
      lessonId: lesson.id,
      title: lesson.title,
    });

    setSessionId(created.session.id);
    persistLessonSessionId(lesson.id, created.session.id);
    return created.session.id;
  }, [sessionId, userId, createSessionAsync, lesson.id, lesson.title]);

  const selectSession = useCallback(
    (nextSessionId: string) => {
      setSessionId(nextSessionId);
      persistLessonSessionId(lesson.id, nextSessionId);
      setStreamPhase("idle");
      setShouldAutoScroll(true);

      const cached = readCachedMessages(queryClient, nextSessionId);
      setMessages(cached);

      if (cached.length === 0) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.messages(nextSessionId),
        });
      }
    },
    [lesson.id, queryClient],
  );

  const handleNewChat = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setInput("");
    setStreamPhase("idle");
    setShouldAutoScroll(true);
    clearLessonSessionId(lesson.id);
    setSidebarOpen(false);
  }, [lesson.id]);

  const performDeleteSession = useCallback(
    (targetSessionId: string) => {
      if (
        deleteSessionMutation.isPending &&
        deleteSessionMutation.variables === targetSessionId
      ) {
        return;
      }

      dismissDeleteSessionToast(targetSessionId);

      deleteSessionMutation.mutate(targetSessionId, {
        onSuccess: () => {
          showSuccess("Chat deleted");
          if (sessionId === targetSessionId) {
            setSessionId(null);
            setMessages([]);
            setInput("");
            clearLessonSessionId(lesson.id);
          }
        },
      });
    },
    [deleteSessionMutation, sessionId, lesson.id],
  );

  const handleDeleteSession = useCallback(
    (targetSessionId: string) => {
      if (deleteSessionMutation.isPending) return;

      const target = savedSessions.find(
        (session) => session.id === targetSessionId,
      );
      confirmDeleteSession(
        targetSessionId,
        sessionPreviewText(target?.preview ?? null, "this chat"),
        () => performDeleteSession(targetSessionId),
      );
    },
    [savedSessions, performDeleteSession, deleteSessionMutation.isPending],
  );

  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loadingMore || !sessionId) return;
    setShouldAutoScroll(false);
    const container = messagesContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;

    await messagesQuery.fetchNextPage();

    setTimeout(() => {
      if (container) {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop += newScrollHeight - prevScrollHeight;
      }
    }, 0);
  }, [hasMore, loadingMore, sessionId, messagesQuery]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

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
      showError(MIC_DENIED_MSG);
    }
  }

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
    if (blob.size === 0) {
      showError(
        "No audio captured. Hold the mic button slightly longer and try again.",
      );
      setTranscribing(false);
      return;
    }

    transcribeMutation.mutate(blob, {
      onSuccess: (data) => {
        if (data?.text) setInput(data.text);
        setTranscribing(false);
      },
      onError: () => setTranscribing(false),
    });
  }

  async function runChat(
    userText: string,
    history: ChatMessage[],
    currentSessionId: string,
    options?: { skipSetup?: boolean },
  ) {
    if (!options?.skipSetup) {
      setLoading(true);
      setStreamPhase("thinking");
      setShouldAutoScroll(true);
      setMessages([...history, { role: "assistant", content: "" }]);
    }

    let finalMessages = [
      ...history,
      { role: "assistant" as const, content: "" },
    ];

    try {
      await streamLessonChatWithRetry({
        sessionId: currentSessionId,
        messages: history,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        userId: userId!,
        onChunk: (buffer) => {
          if (buffer.trim()) setStreamPhase("streaming");
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              ...next[next.length - 1],
              content: buffer,
            };
            finalMessages = next;
            return next;
          });
        },
        onSessionId: (id) => {
          setSessionId(id);
          persistLessonSessionId(lesson.id, id);
        },
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.messages(currentSessionId),
      });
      updateMessagesCache(finalMessages);
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions(userId, lesson.id),
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      showError(getClientErrorMessage(error, "Chat failed"));
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          ...next[next.length - 1],
          content: "Sorry, I encountered an error. Please try again.",
        };
        return next;
      });
    }

    setLoading(false);
    setStreamPhase("idle");
  }

  async function sendMessage(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || loading || !userId) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const history = [...messages, userMsg];
    setInput("");

    // Show user message + thinking state immediately — don't wait for session/API.
    setLoading(true);
    setStreamPhase("thinking");
    setShouldAutoScroll(true);
    setMessages([...history, { role: "assistant", content: "" }]);

    let currentSessionId = sessionId;
    try {
      if (!currentSessionId) {
        currentSessionId = await ensureSession();
      }
    } catch {
      setLoading(false);
      setStreamPhase("idle");
      setMessages(history);
      return;
    }

    if (!currentSessionId) {
      setLoading(false);
      setStreamPhase("idle");
      setMessages(history);
      return;
    }

    await runChat(text, history, currentSessionId, { skipSetup: true });
  }

  async function handleRegenerate() {
    if (loading || !userId) return;

    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex === -1) return;

    const historyForApi = messages.slice(0, lastUserIndex + 1);
    const lastUserMsg = historyForApi[lastUserIndex];

    let currentSessionId: string | null;
    try {
      currentSessionId = await ensureSession();
    } catch {
      return;
    }

    if (!currentSessionId) return;

    await runChat(lastUserMsg.content, historyForApi, currentSessionId);
  }

  function formatRecordingTime(totalSeconds: number) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return i;
    }
    return -1;
  })();

  const hasSavedChats = savedSessions.length > 0;

  const sidebarCommonProps = {
    sessions: savedSessions,
    activeSessionId: sessionId,
    onSelect: selectSession,
    onNewChat: handleNewChat,
    onDelete: handleDeleteSession,
    deletingSessionId: deleteSessionMutation.isPending
      ? (deleteSessionMutation.variables ?? null)
      : null,
    disabled: loading || !userId,
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      {hasSavedChats && (
        <ChatSidebar {...sidebarCommonProps} className="hidden md:flex" />
      )}

      {sidebarOpen && hasSavedChats && (
        <>
          <button
            type="button"
            aria-label="Close history"
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <ChatSidebar
            {...sidebarCommonProps}
            className="fixed inset-y-0 left-0 z-50 w-64 shadow-lg md:hidden"
            onClose={() => setSidebarOpen(false)}
          />
        </>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {hasSavedChats && (
        <div
          className="flex flex-none items-center gap-2 border-b px-3 py-2 md:hidden"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className={`${chatBtnClass} flex h-8 w-8 items-center justify-center rounded-lg border hover:opacity-90`}
            style={{
              borderColor: "var(--border-strong)",
              background: "var(--input-bg)",
              color: "var(--text-muted)",
            }}
            aria-label="Open chat history"
          >
            <RiMenuLine size={16} />
          </button>
          <p
            className="min-w-0 flex-1 truncate text-center text-[12px] font-medium"
            style={{ color: "var(--text)" }}
          >
            {lesson.title}
          </p>
          <button
            type="button"
            onClick={handleNewChat}
            disabled={loading || !userId}
            className={`${chatBtnClass} flex h-8 w-8 items-center justify-center rounded-lg border hover:opacity-90`}
            style={{
              borderColor: "var(--border-strong)",
              background: "var(--input-bg)",
              color: "var(--text-muted)",
              opacity: loading || !userId ? 0.5 : 1,
            }}
            aria-label="New chat"
          >
            <RiAddLine size={16} />
          </button>
        </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col px-3 py-3 sm:px-4">
          <div
            ref={messagesContainerRef}
            className="min-h-0 flex-1 overflow-y-auto"
          >
            <div className="flex w-full flex-col gap-3">
          {loadingMore && (
            <LoadingIndicator
              label="Loading older messages…"
              className="py-2"
            />
          )}

          {isLoadingHistory && <SkeletonChatHistory />}

          {showEmptyState && (
            <div className="flex w-full flex-col py-1">
              <ChatEmptyState
                lesson={lesson}
                onSelectSuggestion={sendMessage}
                disabled={loading || !userId}
              />
            </div>
          )}

          {messages.map((msg, i) => {
            const isLastAssistant = i === lastAssistantIndex;
            const isThinking =
              isLastAssistant &&
              streamPhase === "thinking" &&
              msg.content === "";
            const isStreaming =
              isLastAssistant &&
              streamPhase === "streaming" &&
              msg.content !== "";

            return (
              <ChatMessageBubble
                key={i}
                message={msg}
                isThinking={isThinking}
                isStreaming={isStreaming}
                canRegenerate={
                  isLastAssistant &&
                  !loading &&
                  streamPhase === "idle" &&
                  !!msg.content
                }
                onRegenerate={handleRegenerate}
              />
            );
          })}
            </div>
          </div>

          <div
            className="mt-3 w-full flex-none border-t pt-3"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="chat-composer relative w-full rounded-xl border"
              style={{
                border: "1px solid var(--border-strong)",
                background: "var(--input-bg)",
              }}
            >
              <textarea
                ref={inputRef}
                rows={1}
                className="chat-composer-field block min-h-11 max-h-40 w-full resize-none overflow-y-auto border-0 bg-transparent px-3 pt-2.5 pb-10 pr-18 text-[12px] leading-relaxed outline-none focus:outline-none focus-visible:outline-none"
                style={{ color: "var(--text)" }}
                value={transcribing ? TRANSCRIBING_LABEL : input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={`Ask about ${lesson.title}${PLACEHOLDER_SUFFIX}`}
                disabled={transcribing}
              />

              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <div className="relative">
                  <div
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 max-w-[calc(100vw-4rem)] -translate-x-1/2 rounded-lg px-2.5 py-1 text-center text-[11px] whitespace-normal transition-all duration-200 sm:max-w-none sm:whitespace-nowrap"
                    style={{
                      background: recording
                        ? "var(--red-soft)"
                        : "var(--accent-soft)",
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
                    type="button"
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    onMouseEnter={() => setShowMicHint(true)}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    onTouchCancel={stopRecording}
                    onBlur={() => setShowMicHint(false)}
                    onFocus={() => setShowMicHint(true)}
                    aria-label={
                      recording ? RELEASE_TO_STOP_LABEL : HOLD_TO_RECORD_LABEL
                    }
                    disabled={transcribing}
                    className={`${chatBtnClass} flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:opacity-80`}
                    style={{
                      color: recording ? "var(--red)" : "var(--text-muted)",
                      background: recording ? "var(--red-soft)" : "transparent",
                      opacity: transcribing ? 0.5 : 1,
                      cursor: transcribing ? "not-allowed" : "pointer",
                    }}
                  >
                    {recording ? (
                      <RiStopCircleLine size={17} />
                    ) : (
                      <RiMicLine size={17} />
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={loading || transcribing || !input.trim() || !userId}
                  aria-label={SEND_LABEL}
                  className={`${chatBtnClass} flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:opacity-90`}
                  style={{
                    background: "var(--accent)",
                    color: "var(--on-accent)",
                    opacity:
                      loading || transcribing || !input.trim() ? 0.45 : 1,
                    cursor:
                      loading || transcribing || !input.trim()
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  <RiSendPlane2Line size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
