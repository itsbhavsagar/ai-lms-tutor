"use client";

import { toast } from "sonner";
import type { SessionSummary } from "@/lib/api/sessions";
import { sessionPreviewText } from "@/lib/chat/format";
import { chatBtnClass, chatBtnSubtleClass } from "@/lib/chat/interactive";
import {
  RiAddLine,
  RiChat3Line,
  RiCloseLine,
  RiDeleteBinLine,
} from "react-icons/ri";

type ChatSidebarProps = {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDelete: (sessionId: string) => void;
  deletingSessionId?: string | null;
  disabled?: boolean;
  className?: string;
  onClose?: () => void;
};

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onNewChat,
  onDelete,
  deletingSessionId = null,
  disabled = false,
  className = "",
  onClose,
}: ChatSidebarProps) {
  function handleSelect(sessionId: string) {
    if (sessionId === activeSessionId) return;
    onSelect(sessionId);
    onClose?.();
  }

  const hasChats = sessions.length > 0;

  return (
    <aside
      className={`flex min-h-0 w-48 shrink-0 flex-col border-r lg:w-56 ${className}`}
      style={{
        background: "var(--surface-raised)",
        borderColor: "var(--border)",
      }}
    >
      {(hasChats || onClose) && (
      <div
        className="flex flex-none items-center gap-1.5 border-b px-3 py-2.5"
        style={{ borderColor: "var(--border)" }}
      >
        {hasChats && (
        <button
          type="button"
          onClick={onNewChat}
          disabled={disabled}
          className={`${chatBtnClass} flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-[12px] font-medium hover:opacity-90`}
          style={{
            borderColor: "var(--border-strong)",
            background: "var(--bg-panel)",
            color: "var(--text)",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <RiAddLine size={14} />
          New chat
        </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={`${chatBtnSubtleClass} flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${hasChats ? "" : "ml-auto"}`}
            style={{ color: "var(--text-muted)" }}
            aria-label="Close history"
          >
            <RiCloseLine size={18} />
          </button>
        )}
      </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {sessions.length === 0 ? (
          <p
            className="px-1 py-4 text-center text-[11px] leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            No chats yet
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {sessions.map((session) => {
              const active = session.id === activeSessionId;
              const isDeleting = deletingSessionId === session.id;
              const label = sessionPreviewText(
                session.preview,
                "New conversation",
              );

              return (
                <div
                  key={session.id}
                  className="group flex min-w-0 items-center gap-0.5 rounded-lg transition-colors hover:bg-(--border)/40"
                  style={{
                    background: active ? "var(--accent-soft)" : "transparent",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(session.id)}
                    disabled={isDeleting}
                    className={`${chatBtnSubtleClass} flex min-w-0 flex-1 items-center gap-1.5 px-2 py-2 text-left`}
                    style={{
                      color: active ? "var(--text)" : "var(--text-muted)",
                      opacity: isDeleting ? 0.5 : 1,
                    }}
                  >
                    <RiChat3Line size={13} className="shrink-0" />
                    <span className="truncate text-[12px] leading-snug">
                      {label}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(session.id)}
                    disabled={isDeleting || disabled || !!deletingSessionId}
                    className={`${chatBtnSubtleClass} mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100`}
                    style={{ color: "var(--red)" }}
                    aria-label={`Delete ${label}`}
                  >
                    <RiDeleteBinLine size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

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
