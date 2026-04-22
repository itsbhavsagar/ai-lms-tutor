"use client";
import { useState, useEffect } from "react";
import { Lesson } from "../data/lessons";
import { RiPencilLine, RiSaveLine, RiStickyNoteLine } from "react-icons/ri";
import { getOrCreateUserId } from "@/lib/utils/localStorage";

const LABEL_SAVE = "Save Notes";
const LABEL_EDIT = "Edit";
const LABEL_NOTES = "Notes";
const LABEL_SAVED = "Saved Notes";
const LABEL_WORDS = "words";
const PLACEHOLDER_SUFFIX =
  " here…\n\nTip: Summarize key points in your own words — it helps you remember better.";

export default function NotesTab({ lesson }: { lesson: Lesson }) {
  const [content, setContent] = useState("");
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  useEffect(() => {
    loadNotes();
  }, [lesson.id]);

  async function loadNotes() {
    try {
      setLoading(true);
      const userId = getOrCreateUserId();
      const response = await fetch(
        `/api/notes?userId=${userId}&lessonId=${lesson.id}`,
      );
      const data = await response.json();
      if (data.note) {
        setContent(data.note.content);
        setLocked(true);
      } else {
        setContent("");
        setLocked(false);
      }
    } catch (error) {
      console.error("Failed to load notes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!content.trim()) return;
    try {
      setSaving(true);
      const userId = getOrCreateUserId();
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          lessonId: lesson.id,
          content,
        }),
      });
      const data = await response.json();
      if (data.note) {
        setLocked(true);
        console.log("[Notes] Saved successfully");
      }
    } catch (error) {
      console.error("Failed to save notes:", error);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit() {
    setLocked(false);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2
            className="text-[15px] font-semibold"
            style={{ color: "var(--text)" }}
          >
            {LABEL_NOTES}
          </h2>
          <p
            className="break-words text-[12px]"
            style={{ color: "var(--text-muted)" }}
          >
            {lesson.title}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {wordCount} {LABEL_WORDS}
          </span>
          {locked ? (
            <button
              onClick={handleEdit}
              className="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors"
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
              disabled={!content.trim() || saving}
              className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-white transition-opacity"
              style={{
                background: "var(--accent)",
                opacity: content.trim() && !saving ? 1 : 0.4,
                cursor: content.trim() && !saving ? "pointer" : "not-allowed",
              }}
            >
              <RiSaveLine size={13} />
              {saving ? "Saving..." : LABEL_SAVE}
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {loading ? (
          <div
            className="flex h-full items-center justify-center text-center"
            style={{ color: "var(--text-muted)" }}
          >
            Loading notes...
          </div>
        ) : locked ? (
          <div
            className="h-full overflow-y-auto rounded-xl border p-4 sm:p-5"
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
            {content.split("\n").map((line, i) => (
              <p
                key={i}
                className="min-h-5 break-words text-[13px] leading-relaxed"
                style={{ color: "var(--text)" }}
              >
                {line}
              </p>
            ))}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Write your notes about ${lesson.title}${PLACEHOLDER_SUFFIX}`}
            className="h-full w-full min-w-0 resize-none rounded-xl border p-4 text-[13px] leading-relaxed outline-none transition-colors sm:p-5"
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
