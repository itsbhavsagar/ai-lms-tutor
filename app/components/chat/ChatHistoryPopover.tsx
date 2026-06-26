"use client";

import { memo } from "react";
import type { SessionSummary } from "@/lib/api/sessions";
import { chatBtnClass, chatBtnSubtleClass } from "@/lib/chat/interactive";
import type { LessonWorkflowProgress } from "@/lib/learning/workflow-progress";
import { RiArrowRightSLine, RiPencilLine } from "react-icons/ri";
import { ChatHistorySessionRow } from "./ChatHistoryDrawer";

const POPOVER_PREVIEW_LIMIT = 5;

type ChatHistoryPopoverProps = {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  progress: LessonWorkflowProgress;
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDelete: (sessionId: string) => void;
  deletingSessionId?: string | null;
  onViewAll: () => void;
  disabled?: boolean;
};

function ChatHistoryPopover({
  sessions,
  activeSessionId,
  progress,
  onSelect,
  onNewChat,
  onDelete,
  deletingSessionId = null,
  onViewAll,
  disabled = false,
}: ChatHistoryPopoverProps) {
  const previewSessions = sessions.slice(0, POPOVER_PREVIEW_LIMIT);
  const hasMore = sessions.length > POPOVER_PREVIEW_LIMIT;

  return (
    <div className="w-72 overflow-hidden rounded-xl border border-border bg-panel shadow-md">
      <div className="border-b border-border px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Recent chats
        </p>
      </div>

      <div className="max-h-64 overflow-y-auto px-1.5 py-1.5">
        {previewSessions.map((session) => (
          <ChatHistorySessionRow
            key={session.id}
            session={session}
            active={session.id === activeSessionId}
            isDeleting={deletingSessionId === session.id}
            progress={progress}
            deleteAlwaysVisible
            onSelect={() => onSelect(session.id)}
            onDelete={() => onDelete(session.id)}
            disabled={disabled || !!deletingSessionId}
          />
        ))}
      </div>

      <div className="flex flex-col gap-0.5 border-t border-border px-1.5 py-1.5">
        <button
          type="button"
          onClick={onNewChat}
          disabled={disabled}
          className={`${chatBtnClass} flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-ink hover:bg-border/30`}
        >
          <RiPencilLine size={14} />
          New chat
        </button>
        {hasMore && (
          <button
            type="button"
            onClick={onViewAll}
            className={`${chatBtnSubtleClass} flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[12px] font-medium text-muted hover:bg-border/30`}
          >
            View all
            <RiArrowRightSLine size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(ChatHistoryPopover);
