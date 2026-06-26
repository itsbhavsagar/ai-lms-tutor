"use client";

import { memo } from "react";
import type { ChatMessage } from "@/app/types/chat";
import type { Lesson } from "@/app/data/lessons";
import ChatEmptyState from "./ChatEmptyState";
import ChatMessageBubble from "./ChatMessageBubble";
import LoadingIndicator from "../ui/LoadingIndicator";
import { SkeletonChatHistory } from "../ui/Skeleton";

type ChatMessagesPanelProps = {
  lesson: Lesson;
  messages: ChatMessage[];
  lastAssistantIndex: number;
  streamPhase: "idle" | "thinking" | "streaming";
  loading: boolean;
  loadingMore: boolean;
  showChatContentLoader: boolean;
  showEmptyState: boolean;
  onSelectSuggestion: (text: string) => void;
  onRegenerate: () => void;
  userId: string | null;
};

function ChatMessagesPanel({
  lesson,
  messages,
  lastAssistantIndex,
  streamPhase,
  loading,
  loadingMore,
  showChatContentLoader,
  showEmptyState,
  onSelectSuggestion,
  onRegenerate,
  userId,
}: ChatMessagesPanelProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      {loadingMore && (
        <LoadingIndicator
          label="Loading older messages…"
          className="py-2"
        />
      )}

      {showChatContentLoader ? (
        <SkeletonChatHistory />
      ) : (
        <>
          {showEmptyState && (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-4 py-6 sm:gap-5 sm:py-10">
              <div className="w-full max-w-sm space-y-1 text-center">
                <p
                  className="text-[11px] font-medium uppercase tracking-widest"
                  style={{ color: "var(--text-muted)", opacity: 0.7 }}
                >
                  AI Mentor
                </p>
                <h2
                  className="text-[16px] font-semibold tracking-tight sm:text-[17px]"
                  style={{ color: "var(--text)" }}
                >
                  {lesson.title}
                </h2>
                <p
                  className="text-[11px] leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  Chat what you want — ask, get quizzed, or go deep on production
                </p>
              </div>

              <div className="w-full max-w-sm">
                <p
                  className="mb-2 text-[10px] font-medium uppercase tracking-wide"
                  style={{ color: "var(--text-muted)", opacity: 0.65 }}
                >
                  Or try
                </p>
                <ChatEmptyState
                  lesson={lesson}
                  onSelectSuggestion={onSelectSuggestion}
                  disabled={loading || !userId}
                />
              </div>
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
                onRegenerate={onRegenerate}
              />
            );
          })}
        </>
      )}
    </div>
  );
}

export default memo(ChatMessagesPanel);
