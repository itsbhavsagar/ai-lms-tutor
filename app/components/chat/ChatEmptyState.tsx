"use client";

import { RiSparkling2Line } from "react-icons/ri";
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
    <div
      className="panel-enter flex w-full flex-col gap-4 rounded-xl border p-4 sm:p-5"
      style={{
        background: "var(--surface-raised)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="empty-state-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <RiSparkling2Line size={18} />
        </div>
        <div className="min-w-0 space-y-1.5">
          <h3
            className="text-[14px] font-semibold tracking-tight"
            style={{ color: "var(--text)" }}
          >
            Ask your AI tutor anything
          </h3>
          <p
            className="text-[12px] leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Get explanations and practice questions about{" "}
            <span className="font-medium" style={{ color: "var(--text)" }}>
              {lesson.title}
            </span>
            .
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {suggestions.map((question, i) => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onSelectSuggestion(question)}
            className={`${btnInteractive} suggestion-chip rounded-xl border px-3 py-2.5 text-left text-[12px] leading-snug hover:border-[var(--accent-border)] hover:bg-[var(--bg-panel)] disabled:opacity-50`}
            style={{
              background: "var(--bg-panel)",
              borderColor: "var(--border-strong)",
              color: "var(--text)",
              animationDelay: `${0.08 + i * 0.04}s`,
            }}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
