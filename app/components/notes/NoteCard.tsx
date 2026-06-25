"use client";

import { memo } from "react";
import type { NoteItem } from "@/lib/api/notes";
import { formatNoteDate, notePreview } from "@/lib/api/notes";
import { getNoteCardColors } from "@/lib/notes/colors";

type NoteCardProps = {
  note: Pick<NoteItem, "id" | "title" | "content" | "updatedAt">;
  active: boolean;
  onSelect: () => void;
};

function NoteCard({ note, active, onSelect }: NoteCardProps) {
  const colors = getNoteCardColors(note.id);
  const displayTitle = note.title.trim() || "Untitled";

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex min-h-[88px] w-full appearance-none flex-col gap-1 rounded-xl border p-3 text-left transition-colors duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-0"
      style={{
        background: active ? colors.backgroundActive : colors.background,
        borderColor: active ? colors.borderActive : colors.border,
        boxShadow: active
          ? `inset 0 0 0 1px ${colors.borderActive}`
          : "inset 0 0 0 1px transparent",
        outlineColor: "var(--accent)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <p
        className="truncate text-[13px] font-semibold leading-snug"
        style={{ color: colors.title }}
      >
        {displayTitle}
      </p>
      <p
        className="line-clamp-2 flex-1 text-[11px] leading-relaxed"
        style={{ color: colors.muted }}
      >
        {notePreview(note.content)}
      </p>
      <p
        className="mt-auto text-[10px] tabular-nums"
        style={{ color: colors.muted, opacity: 0.85 }}
      >
        {formatNoteDate(note.updatedAt)}
      </p>
    </button>
  );
}

export default memo(NoteCard);
