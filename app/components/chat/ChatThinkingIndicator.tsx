"use client";

type ChatThinkingIndicatorProps = {
  label?: string;
};

export default function ChatThinkingIndicator({
  label = "Thinking",
}: ChatThinkingIndicatorProps) {
  return (
    <div className="flex items-center gap-2.5 py-0.5">
      <span className="flex items-center gap-1">
        <span className="thinking-bar thinking-bar-1" />
        <span className="thinking-bar thinking-bar-2" />
        <span className="thinking-bar thinking-bar-3" />
      </span>
      <span className="thinking-shimmer text-[11px] font-medium tracking-wide text-muted">
        {label}
      </span>
    </div>
  );
}
