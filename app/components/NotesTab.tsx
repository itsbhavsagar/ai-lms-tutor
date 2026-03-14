"use client";
import { useState } from "react";
import { Lesson } from "../data/lessons";
import { RiPencilLine, RiSaveLine, RiStickyNoteLine } from "react-icons/ri";

const LABEL_SAVE = "Save Notes";
const LABEL_EDIT = "Edit";
const LABEL_NOTES = "Notes";
const LABEL_SAVED = "Saved Notes";
const LABEL_WORDS = "words";
const PLACEHOLDER_SUFFIX =
  " here…\n\nTip: Summarize key points in your own words — it helps you remember better.";

export default function NotesTab({ lesson }: { lesson: Lesson }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [locked, setLocked] = useState<Record<string, boolean>>({});

  const currentNote = notes[lesson.id] ?? "";
  const isLocked = locked[lesson.id] ?? false;
  const wordCount = currentNote.trim()
    ? currentNote.trim().split(/\s+/).length
    : 0;

  function handleSave() {
    if (currentNote.trim()) setLocked((p) => ({ ...p, [lesson.id]: true }));
  }

  function handleEdit() {
    setLocked((p) => ({ ...p, [lesson.id]: false }));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-none items-center justify-between">
        <div>
          <h2
            className="text-[15px] font-semibold"
            style={{ color: "var(--text)" }}
          >
            {LABEL_NOTES}
          </h2>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            {lesson.title}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {wordCount} {LABEL_WORDS}
          </span>
          {isLocked ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors"
              style={{
                border: "1px solid var(--border-strong)",
                color: "var(--text)",
                background: "var(--bg)",
              }}
            >
              <RiPencilLine size={13} />
              {LABEL_EDIT}
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!currentNote.trim()}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-white transition-opacity"
              style={{
                background: "var(--accent)",
                opacity: currentNote.trim() ? 1 : 0.4,
                cursor: currentNote.trim() ? "pointer" : "not-allowed",
              }}
            >
              <RiSaveLine size={13} />
              {LABEL_SAVE}
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {isLocked ? (
          <div
            className="h-full overflow-y-auto rounded-xl border p-5"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="mb-3 flex items-center gap-1.5">
              <RiStickyNoteLine
                size={12}
                style={{ color: "var(--text-muted)" }}
              />
              <p
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                {LABEL_SAVED}
              </p>
            </div>
            {currentNote.split("\n").map((line, i) => (
              <p
                key={i}
                className="min-h-5 text-[13px] leading-relaxed"
                style={{ color: "var(--text)" }}
              >
                {line}
              </p>
            ))}
          </div>
        ) : (
          <textarea
            value={currentNote}
            onChange={(e) =>
              setNotes((p) => ({ ...p, [lesson.id]: e.target.value }))
            }
            placeholder={`Write your notes about ${lesson.title}${PLACEHOLDER_SUFFIX}`}
            className="h-full w-full resize-none rounded-xl border p-5 text-[13px] leading-relaxed outline-none transition-colors"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border-strong)",
              color: "var(--text)",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--border-strong)")
            }
          />
        )}
      </div>
    </div>
  );
}
