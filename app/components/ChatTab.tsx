"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
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
import {
  persistLessonSessionId,
  clearLessonSessionId,
} from "@/lib/chat/sessionStorage";
import {
  clearCachedChatMessages,
  persistCachedChatMessages,
  persistCachedSessions,
  readCachedChatMessages,
  readCachedSessions,
  removeCachedSession,
} from "@/lib/chat/chatCache";
import { usePersistedLessonSessionId } from "@/lib/hooks/usePersistedLessonSessionId";
import { queryKeys } from "@/lib/query/keys";
import { useLessonWorkflowProgress } from "@/lib/hooks/useLessonWorkflowProgress";
import {
  chatComposerFooterClass,
  chatTabBodyClass,
  chatTabInnerClass,
  chatTabShellClass,
  scrollAreaClass,
} from "@/lib/ui/styles";
import ChatComposer from "./chat/ChatComposer";
import ChatHistoryToolbar, {
  ChatHistoryDrawerLayer,
} from "./chat/ChatHistoryControls";
import {
  confirmDeleteSession,
  dismissDeleteSessionToast,
} from "./chat/ChatHistoryDrawer";
import ChatMessagesPanel from "./chat/ChatMessagesPanel";

const PLACEHOLDER_SUFFIX = "…";
const SEND_LABEL = "Send";
const TRANSCRIBING_LABEL = "Transcribing…";
const HOLD_TO_RECORD_LABEL = "Hold to record voice";
const RELEASE_TO_STOP_LABEL = "Release when you are done";
const MIC_DENIED_MSG = "Microphone access denied.";

type StreamPhase = "idle" | "thinking" | "streaming";

function useIsClientReady(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function ChatTab({
  lesson,
  headerActionsEl = null,
}: {
  lesson: Lesson;
  headerActionsEl?: HTMLElement | null;
}) {
  const isClientReady = useIsClientReady();
  const userId = useUserId();
  const queryClient = useQueryClient();
  const { mutateAsync: createSessionAsync } = useCreateSessionMutation(
    lesson.id,
  );
  const transcribeMutation = useTranscribeMutation();
  const { data: sessionsData, isSuccess: sessionsLoaded } =
    useSessionsQuery(lesson.id);
  const deleteSessionMutation = useDeleteSessionMutation(lesson.id);
  const persistedSessionId = usePersistedLessonSessionId(lesson.id);

  const [messagesOverride, setMessagesOverride] = useState<
    ChatMessage[] | null
  >(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamPhase, setStreamPhase] = useState<StreamPhase>("idle");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [showMicHint, setShowMicHint] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [sessionIdOverride, setSessionIdOverride] = useState<
    string | null | undefined
  >(undefined);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  const sessions = useMemo(() => {
    if (!userId) return [];
    if (sessionsLoaded && sessionsData?.sessions) {
      return sessionsData.sessions;
    }
    return readCachedSessions(userId, lesson.id);
  }, [userId, sessionsLoaded, sessionsData?.sessions, lesson.id]);

  const savedSessions = sessions.filter((session) => session.messageCount > 0);

  const displaySavedSessions = useMemo(() => {
    if (sessionsLoaded) return savedSessions;
    if (!userId) return [];
    return readCachedSessions(userId, lesson.id).filter(
      (session) => session.messageCount > 0,
    );
  }, [userId, lesson.id, savedSessions, sessionsLoaded]);
  const sessionIdsKey = savedSessions.map((session) => session.id).join(",");

  const restoredSessionId = useMemo(() => {
    if (!sessionsLoaded || !sessionIdsKey) return null;
    if (!persistedSessionId || !sessionIdsKey.split(",").includes(persistedSessionId)) {
      return null;
    }
    return persistedSessionId;
  }, [sessionsLoaded, sessionIdsKey, persistedSessionId]);

  useEffect(() => {
    if (!sessionsLoaded) return;
    if (!persistedSessionId) return;
    if (!sessionIdsKey || !sessionIdsKey.split(",").includes(persistedSessionId)) {
      clearLessonSessionId(lesson.id);
    }
  }, [sessionsLoaded, sessionIdsKey, persistedSessionId, lesson.id]);

  const sessionId =
    sessionIdOverride !== undefined
      ? sessionIdOverride
      : sessionsLoaded
        ? restoredSessionId
        : persistedSessionId;

  const setSessionId = useCallback((id: string | null) => {
    setSessionIdOverride(id);
  }, []);

  const messagesQuery = useMessagesQuery(sessionId);
  const updateMessagesCache = useUpdateMessagesCache(sessionId);

  const queryMessages = useMemo(() => {
    if (!sessionId || !messagesQuery.isSuccess) return [];
    return flattenMessages(messagesQuery.data);
  }, [sessionId, messagesQuery.data, messagesQuery.isSuccess]);

  const cachedMessages = useMemo(
    () => (sessionId ? readCachedChatMessages(sessionId) : []),
    [sessionId],
  );

  const messages =
    messagesOverride !== null
      ? messagesOverride
      : queryMessages.length > 0
        ? queryMessages
        : cachedMessages;

  useEffect(() => {
    if (!userId || !sessionsData?.sessions) return;
    persistCachedSessions(userId, lesson.id, sessionsData.sessions);
  }, [userId, lesson.id, sessionsData?.sessions]);

  useEffect(() => {
    if (!sessionId || queryMessages.length === 0) return;
    persistCachedChatMessages(sessionId, queryMessages);
  }, [sessionId, queryMessages]);

  const setMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setMessagesOverride((prevOverride) => {
        const base = prevOverride !== null ? prevOverride : queryMessages;
        return typeof updater === "function" ? updater(base) : updater;
      });
    },
    [queryMessages],
  );

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

  const isExplicitNewChat = sessionIdOverride === null;

  const isLoadingHistory =
    !!sessionId &&
    messages.length === 0 &&
    !loading &&
    (messagesQuery.isLoading || messagesQuery.isFetching);

  const isPendingSavedChat =
    !!sessionId &&
    !!persistedSessionId &&
    !isExplicitNewChat &&
    messages.length === 0 &&
    !loading &&
    streamPhase === "idle" &&
    isLoadingHistory;

  const showChatContentLoader =
    (isLoadingHistory || isPendingSavedChat) && messages.length === 0;

  const showEmptyState =
    isClientReady &&
    !showChatContentLoader &&
    !loading &&
    streamPhase === "idle" &&
    messages.length === 0 &&
    (isExplicitNewChat ||
      (!sessionId && !persistedSessionId && !isLoadingHistory));

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
  }, [sessionId, userId, createSessionAsync, lesson.id, lesson.title, setSessionId]);

  const selectSession = useCallback(
    (nextSessionId: string) => {
      setSessionIdOverride(nextSessionId);
      persistLessonSessionId(lesson.id, nextSessionId);
      setStreamPhase("idle");
      setShouldAutoScroll(true);

      const cached = readCachedMessages(queryClient, nextSessionId);
      setMessagesOverride(cached.length > 0 ? cached : null);

      if (cached.length === 0) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.messages(nextSessionId),
        });
      }
    },
    [lesson.id, queryClient],
  );

  const handleNewChat = useCallback(() => {
    setSessionIdOverride(null);
    setMessagesOverride([]);
    setInput("");
    setStreamPhase("idle");
    setShouldAutoScroll(true);
    setHistoryDrawerOpen(false);
  }, []);

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
          clearCachedChatMessages(targetSessionId);
          if (userId) {
            removeCachedSession(userId, lesson.id, targetSessionId);
          }
          if (sessionId === targetSessionId) {
            setSessionIdOverride(null);
            setMessagesOverride([]);
            setInput("");
            clearLessonSessionId(lesson.id);
          }
        },
      });
    },
    [deleteSessionMutation, sessionId, lesson.id, userId],
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
      setRecordingSeconds(0);
      setRecording(true);
    } catch {
      showError(MIC_DENIED_MSG);
    }
  }

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setRecordingSeconds(0);
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
    if (!recording) return;

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
      setMessagesOverride(finalMessages);
      persistCachedChatMessages(currentSessionId, finalMessages);
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
    setMessagesOverride([...history, { role: "assistant", content: "" }]);

    let currentSessionId = sessionId;
    try {
      if (!currentSessionId) {
        currentSessionId = await ensureSession();
      }
    } catch {
      setLoading(false);
      setStreamPhase("idle");
      setMessagesOverride(history);
      return;
    }

    if (!currentSessionId) {
      setLoading(false);
      setStreamPhase("idle");
      setMessagesOverride(history);
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

  const showHistory =
    displaySavedSessions.length >= 2 ||
    (isExplicitNewChat && displaySavedSessions.length >= 1);
  const showNewChat = displaySavedSessions.length >= 1;
  const showToolbar = showHistory || showNewChat;
  const lessonProgress = useLessonWorkflowProgress(
    lesson.id,
    userId,
    displaySavedSessions.length > 0,
  );

  const historyCommonProps = useMemo(
    () => ({
      sessions: displaySavedSessions,
      activeSessionId: sessionId,
      progress: lessonProgress,
      onSelect: selectSession,
      onNewChat: handleNewChat,
      onDelete: handleDeleteSession,
      deletingSessionId: deleteSessionMutation.isPending
        ? (deleteSessionMutation.variables ?? null)
        : null,
      disabled: loading || !userId,
    }),
    [
      displaySavedSessions,
      sessionId,
      lessonProgress,
      selectSession,
      handleNewChat,
      handleDeleteSession,
      deleteSessionMutation.isPending,
      deleteSessionMutation.variables,
      loading,
      userId,
    ],
  );

  const composerProps = {
    inputRef,
    input,
    onInputChange: setInput,
    onSend: () => sendMessage(),
    loading,
    transcribing,
    userId,
    recording,
    recordingSeconds,
    showMicHint,
    onShowMicHint: setShowMicHint,
    onStartRecording: startRecording,
    onStopRecording: stopRecording,
    formatRecordingTime,
    holdToRecordLabel: HOLD_TO_RECORD_LABEL,
    releaseToStopLabel: RELEASE_TO_STOP_LABEL,
    sendLabel: SEND_LABEL,
    transcribingLabel: TRANSCRIBING_LABEL,
  };

  return (
    <div className={chatTabShellClass}>
      <div className={chatTabInnerClass}>
        {headerActionsEl &&
          showToolbar &&
          createPortal(
            <ChatHistoryToolbar
              {...historyCommonProps}
              drawerOpen={historyDrawerOpen}
              onDrawerOpenChange={setHistoryDrawerOpen}
              showHistory={showHistory}
              showNewChat={showNewChat}
            />,
            headerActionsEl,
          )}
        {showHistory && (
          <ChatHistoryDrawerLayer
            {...historyCommonProps}
            open={historyDrawerOpen}
            onClose={() => setHistoryDrawerOpen(false)}
          />
        )}

        <div className={chatTabBodyClass}>
          <div
            ref={messagesContainerRef}
            className={`${scrollAreaClass} relative z-0`}
          >
            <ChatMessagesPanel
              lesson={lesson}
              messages={messages}
              lastAssistantIndex={lastAssistantIndex}
              streamPhase={streamPhase}
              loading={loading}
              loadingMore={loadingMore}
              showChatContentLoader={showChatContentLoader}
              showEmptyState={showEmptyState}
              onSelectSuggestion={sendMessage}
              onRegenerate={handleRegenerate}
              userId={userId}
            />
          </div>

          <div className={chatComposerFooterClass}>
            <ChatComposer
              {...composerProps}
              placeholder={
                showEmptyState
                  ? "Chat what you want to learn…"
                  : `Ask about ${lesson.title}${PLACEHOLDER_SUFFIX}`
              }
              autoFocus={showEmptyState}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
