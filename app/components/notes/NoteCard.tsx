"use client";

import { memo, type CSSProperties } from "react";
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

  const cardVars = {
    "--nc-bg": colors.background,
    "--nc-bg-active": colors.backgroundActive,
    "--nc-border": colors.border,
    "--nc-border-active": colors.borderActive,
    "--nc-ring": "transparent",
    "--nc-title": colors.title,
    "--nc-muted": colors.muted,
  } as CSSProperties;

  return (
    <button
      type="button"
      onClick={onSelect}
      data-active={active}
      className="note-card flex min-h-[88px] w-full appearance-none flex-col gap-1 rounded-xl border p-3 text-left outline-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-0"
      style={cardVars}
    >
      <p className="note-card-title truncate text-[13px] font-semibold leading-snug">
        {displayTitle}
      </p>
      <p className="note-card-muted line-clamp-2 flex-1 text-[11px] leading-relaxed">
        {notePreview(note.content)}
      </p>
      <p className="note-card-date mt-auto text-[10px] tabular-nums">
        {formatNoteDate(note.updatedAt)}
      </p>
    </button>
  );
}

export default memo(NoteCard);
