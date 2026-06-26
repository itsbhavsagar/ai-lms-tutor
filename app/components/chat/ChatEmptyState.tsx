"use client";

import type { Lesson } from "@/app/data/lessons";
import { getSuggestedQuestions } from "@/lib/chat/suggestions";
import { btnInteractive } from "@/lib/ui/styles";

type ChatEmptyStateProps = {
  lesson: Lesson;
  onSelectSuggestion: (question: string) => void;
  disabled?: boolean;
};

export default function ChatEmptyState({
  lesson,
  onSelectSuggestion,
  disabled = false,
}: ChatEmptyStateProps) {
  const suggestions = getSuggestedQuestions(lesson);

  return (
    <div className="flex w-full flex-col gap-1.5">
      {suggestions.map((item, i) => (
        <button
          key={item.label}
          type="button"
          disabled={disabled}
          onClick={() => onSelectSuggestion(item.prompt)}
          className={`${btnInteractive} suggestion-chip group flex w-full items-center rounded-lg border border-border bg-surface-raised px-3 py-2 text-left transition-colors hover:border-accent-border hover:bg-panel disabled:opacity-50 [animation-delay:${0.04 + i * 0.03}s]`}
        >
          <span className="text-[11px] font-medium text-muted transition-colors group-hover:text-accent">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
