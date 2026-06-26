"use client";

import { useState } from "react";
import type { ChatMessage } from "@/app/types/chat";
import MessageContent from "../MessageContent";
import ChatThinkingIndicator from "./ChatThinkingIndicator";
import {
  RiCheckLine,
  RiFileCopyLine,
  RiRefreshLine,
} from "react-icons/ri";
import { showSuccess } from "@/lib/utils/toast";
import { chatBtnSubtleClass } from "@/lib/chat/interactive";
import {
  chatBubbleAssistantClass,
  chatBubbleUserClass,
} from "@/lib/ui/styles";

type ChatMessageBubbleProps = {
  message: ChatMessage;
  isStreaming?: boolean;
  isThinking?: boolean;
  canRegenerate?: boolean;
  onRegenerate?: () => void;
};

export default function ChatMessageBubble({
  message,
  isStreaming = false,
  isThinking = false,
  canRegenerate = false,
  onRegenerate,
}: ChatMessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  async function handleCopy() {
    if (!message.content) return;
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    showSuccess("Copied to clipboard");
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className={`msg-in group flex min-w-0 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="mr-1.5 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-on-accent">
          AI
        </div>
      )}

      <div className="flex min-w-0 max-w-[85%] flex-col gap-0.5 sm:max-w-[80%]">
        <div
          className={`stream-bubble relative min-w-0 wrap-wrap-break-word rounded-xl px-3 py-2.5 text-[13px] leading-relaxed sm:px-3.5 ${
            isStreaming ? "is-streaming" : ""
          } ${isUser ? chatBubbleUserClass : chatBubbleAssistantClass}`}
        >
          {isThinking ? (
            <ChatThinkingIndicator />
          ) : isUser ? (
            <span className="whitespace-pre-wrap wrap-wrap-break-word">
              {message.content}
            </span>
          ) : (
            <>
              <div className="stream-content">
                <MessageContent content={message.content} />
              </div>
              {isStreaming && (
                <span className="stream-cursor ml-0.5 inline-block h-[1em] w-[2px] align-text-bottom" />
              )}
            </>
          )}
        </div>

        {!isThinking && message.content && (
          <div
            className={`flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            <button
              type="button"
              onClick={handleCopy}
              className={`${chatBtnSubtleClass} flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted`}
              aria-label="Copy message"
            >
              {copied ? <RiCheckLine size={12} /> : <RiFileCopyLine size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>

            {canRegenerate && onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className={`${chatBtnSubtleClass} flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted`}
              >
                <RiRefreshLine size={12} />
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
