"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { chatBtnClass } from "@/lib/chat/interactive";
import { RiPencilLine, RiHistoryLine } from "react-icons/ri";
import ChatHistoryDrawer, {
  type ChatHistorySessionProps,
} from "./ChatHistoryDrawer";
import ChatHistoryPopover from "./ChatHistoryPopover";

const HOVER_OPEN_MS = 180;
const HOVER_CLOSE_MS = 120;

function subscribeHoverCapable(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getHoverCapableSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

type ChatHistoryUIProps = ChatHistorySessionProps & {
  drawerOpen: boolean;
  onDrawerOpenChange: (open: boolean) => void;
  showHistory: boolean;
  showNewChat: boolean;
};

const iconBtnClass = `${chatBtnClass} flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-input text-muted hover:opacity-90 disabled:opacity-50`;

export const ChatHistoryToolbar = memo(function ChatHistoryToolbar({
  sessions,
  activeSessionId,
  progress,
  onSelect,
  onNewChat,
  onDelete,
  deletingSessionId,
  disabled,
  drawerOpen,
  onDrawerOpenChange,
  showHistory,
  showNewChat,
}: ChatHistoryUIProps) {
  const hoverCapable = useSyncExternalStore(
    subscribeHoverCapable,
    getHoverCapableSnapshot,
    () => false,
  );
  const [popoverOpen, setPopoverOpen] = useState(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  function schedulePopoverOpen() {
    if (!hoverCapable || !showHistory || drawerOpen) return;
    clearTimers();
    openTimerRef.current = setTimeout(() => setPopoverOpen(true), HOVER_OPEN_MS);
  }

  function schedulePopoverClose() {
    if (!hoverCapable) return;
    clearTimers();
    closeTimerRef.current = setTimeout(() => setPopoverOpen(false), HOVER_CLOSE_MS);
  }

  function handleHistoryClick() {
    clearTimers();
    setPopoverOpen(false);
    onDrawerOpenChange(true);
  }

  function handleSelect(sessionId: string) {
    setPopoverOpen(false);
    onSelect(sessionId);
  }

  function handleNewChat() {
    setPopoverOpen(false);
    onDrawerOpenChange(false);
    onNewChat();
  }

  if (!showHistory && !showNewChat) return null;

  return (
    <div className="flex shrink-0 items-center gap-1.5 pb-0.5">
        {showNewChat && (
          <button
            type="button"
            onClick={handleNewChat}
            disabled={disabled}
            aria-label="New chat"
            className={iconBtnClass}
          >
            <RiPencilLine size={16} />
          </button>
        )}

        {showHistory && (
          <div
            className="relative"
            onMouseEnter={schedulePopoverOpen}
            onMouseLeave={schedulePopoverClose}
          >
            <button
              type="button"
              onClick={handleHistoryClick}
              disabled={disabled}
              aria-label={`Continue learning, ${sessions.length} chats`}
              aria-expanded={popoverOpen || drawerOpen}
              aria-haspopup="dialog"
              className={`${iconBtnClass} relative`}
            >
              <RiHistoryLine size={16} />
              <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-semibold leading-none text-on-accent">
                {sessions.length}
              </span>
            </button>

            {popoverOpen && hoverCapable && !drawerOpen && (
              <div
                className="absolute right-0 top-[calc(100%+8px)] z-[100]"
                onMouseEnter={schedulePopoverOpen}
                onMouseLeave={schedulePopoverClose}
              >
                <ChatHistoryPopover
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  progress={progress}
                  onSelect={handleSelect}
                  onNewChat={handleNewChat}
                  onDelete={onDelete}
                  deletingSessionId={deletingSessionId}
                  onViewAll={() => {
                    setPopoverOpen(false);
                    onDrawerOpenChange(true);
                  }}
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        )}
    </div>
  );
});

type ChatHistoryDrawerLayerProps = ChatHistorySessionProps & {
  open: boolean;
  onClose: () => void;
};

export const ChatHistoryDrawerLayer = memo(function ChatHistoryDrawerLayer({
  sessions,
  activeSessionId,
  progress,
  onSelect,
  onNewChat,
  onDelete,
  deletingSessionId,
  disabled,
  open,
  onClose,
}: ChatHistoryDrawerLayerProps) {
  if (!open) return null;

  function handleNewChat() {
    onClose();
    onNewChat();
  }

  function handleSelect(sessionId: string) {
    if (sessionId !== activeSessionId) onSelect(sessionId);
    onClose();
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close history"
        className="absolute inset-0 z-40 bg-black/20"
        onClick={onClose}
      />
      <ChatHistoryDrawer
        sessions={sessions}
        activeSessionId={activeSessionId}
        progress={progress}
        onSelect={handleSelect}
        onNewChat={handleNewChat}
        onDelete={onDelete}
        deletingSessionId={deletingSessionId}
        disabled={disabled}
        onClose={onClose}
        className="absolute inset-y-0 left-0 z-50 w-72 max-w-[85%]"
      />
    </>
  );
});

export default ChatHistoryToolbar;
