"use client";

import { memo } from "react";
import { toast } from "sonner";
import type { SessionSummary } from "@/lib/api/sessions";
import {
  formatSessionRelativeTime,
  sessionPreviewText,
} from "@/lib/chat/format";
import { chatBtnClass, chatBtnSubtleClass } from "@/lib/chat/interactive";
import type { LessonWorkflowProgress } from "@/lib/learning/workflow-progress";
import {
  formatWorkflowProgressLine,
  formatWorkflowSubtitle,
} from "@/lib/learning/workflow-progress";
import {
  RiPencilLine,
  RiCloseLine,
  RiDeleteBinLine,
} from "react-icons/ri";
import { btnOutlineClass } from "@/lib/ui/styles";

export type ChatHistorySessionProps = {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  progress: LessonWorkflowProgress;
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDelete: (sessionId: string) => void;
  deletingSessionId?: string | null;
  disabled?: boolean;
};

type ChatHistoryDrawerProps = ChatHistorySessionProps & {
  onClose: () => void;
  className?: string;
};

function ChatHistoryDrawer({
  sessions,
  activeSessionId,
  progress,
  onSelect,
  onNewChat,
  onDelete,
  deletingSessionId = null,
  disabled = false,
  onClose,
  className = "",
}: ChatHistoryDrawerProps) {
  function handleSelect(sessionId: string) {
    if (sessionId === activeSessionId) return;
    onSelect(sessionId);
    onClose();
  }

  return (
    <aside
      className={`flex min-h-0 flex-col border-r border-border bg-surface-raised shadow-lg ${className}`}
    >
      <div className="flex flex-none items-center gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold tracking-tight text-ink">
            Continue Learning
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted">
            {formatWorkflowProgressLine(progress)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`${chatBtnSubtleClass} flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted`}
          aria-label="Close history"
        >
          <RiCloseLine size={18} />
        </button>
      </div>

      <div className="flex flex-none border-b border-border px-3 py-2.5">
        <button
          type="button"
          onClick={onNewChat}
          disabled={disabled}
          className={`${btnOutlineClass} ${chatBtnClass} flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] hover:opacity-90 ${disabled ? "opacity-50" : ""}`}
        >
          <RiPencilLine size={14} />
          New chat
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <div className="flex flex-col gap-0.5">
          {sessions.map((session) => (
            <ChatHistorySessionRow
              key={session.id}
              session={session}
              active={session.id === activeSessionId}
              isDeleting={deletingSessionId === session.id}
              progress={progress}
              showMeta
              onSelect={() => handleSelect(session.id)}
              onDelete={() => onDelete(session.id)}
              disabled={disabled || !!deletingSessionId}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

export default memo(ChatHistoryDrawer);

type ChatHistorySessionRowProps = {
  session: SessionSummary;
  active: boolean;
  isDeleting: boolean;
  progress: LessonWorkflowProgress;
  showMeta?: boolean;
  showDelete?: boolean;
  deleteAlwaysVisible?: boolean;
  onSelect: () => void;
  onDelete: () => void;
  disabled?: boolean;
};

export const ChatHistorySessionRow = memo(function ChatHistorySessionRow({
  session,
  active,
  isDeleting,
  progress,
  showMeta = false,
  showDelete = true,
  deleteAlwaysVisible = false,
  onSelect,
  onDelete,
  disabled = false,
}: ChatHistorySessionRowProps) {
  const label = sessionPreviewText(session.preview, "New conversation");

  return (
    <div
      className={`group flex min-w-0 items-center gap-0.5 rounded-lg transition-colors hover:bg-border/40 ${
        active ? "bg-accent-soft" : "bg-transparent"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={isDeleting}
        className={`${chatBtnSubtleClass} flex min-w-0 flex-1 flex-col items-start gap-0.5 px-2.5 py-2 text-left ${
          active ? "text-ink" : "text-muted"
        } ${isDeleting ? "opacity-50" : ""}`}
      >
        <span className="flex min-w-0 w-full items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              active ? "bg-green" : "bg-border-strong"
            }`}
            aria-hidden
          />
          <span className="truncate text-[12px] font-medium leading-snug">
            {label}
          </span>
        </span>
        <span className="pl-3.5 text-[10px] leading-snug text-muted">
          {showMeta
            ? `${formatWorkflowSubtitle(progress)} · ${session.messageCount} messages · ${formatSessionRelativeTime(session.updatedAt)}`
            : formatWorkflowSubtitle(progress)}
        </span>
      </button>
      {showDelete && (
      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting || disabled}
        className={`${chatBtnSubtleClass} mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-red ${
          deleteAlwaysVisible
            ? "opacity-100"
            : "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
        }`}
        aria-label={`Delete ${label}`}
      >
        <RiDeleteBinLine size={14} />
      </button>
      )}
    </div>
  );
});

const pendingDeleteConfirmations = new Set<string>();

export function dismissDeleteSessionToast(sessionId: string): void {
  pendingDeleteConfirmations.delete(sessionId);
  toast.dismiss(`delete-session-${sessionId}`);
}

export function confirmDeleteSession(
  sessionId: string,
  preview: string,
  onDelete: () => void,
): void {
  if (pendingDeleteConfirmations.has(sessionId)) {
    return;
  }

  pendingDeleteConfirmations.add(sessionId);

  toast(`Delete "${preview}"?`, {
    id: `delete-session-${sessionId}`,
    description: "This conversation cannot be undone.",
    action: {
      label: "Delete",
      onClick: () => {
        dismissDeleteSessionToast(sessionId);
        onDelete();
      },
    },
    onDismiss: () => {
      pendingDeleteConfirmations.delete(sessionId);
    },
  });
}
