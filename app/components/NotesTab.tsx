"use client";
import { useState, useEffect } from "react";
import { Lesson } from "../data/lessons";

export default function NotesTab({ lesson }: { lesson: Lesson }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [locked, setLocked] = useState<Record<string, boolean>>({});

  const currentNote = notes[lesson.id] || "";
  const isLocked = locked[lesson.id] || false;

  useEffect(() => {
    // unlock when switching lessons so fresh note is editable
  }, [lesson.id]);

  function handleChange(value: string) {
    setNotes((prev) => ({ ...prev, [lesson.id]: value }));
  }

  function handleSave() {
    if (!currentNote.trim()) return;
    setLocked((prev) => ({ ...prev, [lesson.id]: true }));
  }

  function handleEdit() {
    setLocked((prev) => ({ ...prev, [lesson.id]: false }));
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Your notes for{" "}
          <strong style={{ color: "var(--text)" }}>{lesson.title}</strong>
        </p>

        <div style={{ display: "flex", gap: "8px" }}>
          {isLocked ? (
            <button
              onClick={handleEdit}
              style={{
                padding: "7px 16px",
                borderRadius: "7px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              ✏️ Edit
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!currentNote.trim()}
              style={{
                padding: "7px 16px",
                borderRadius: "7px",
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 500,
                cursor: !currentNote.trim() ? "not-allowed" : "pointer",
                opacity: !currentNote.trim() ? 0.4 : 1,
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              Save Notes
            </button>
          )}
        </div>
      </div>

      {/* Locked view */}
      {isLocked ? (
        <div
          style={{
            flex: 1,
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            overflowY: "auto",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: "14px",
            }}
          >
            ✦ Saved Notes
          </p>
          {currentNote.split("\n").map((line, i) => (
            <p
              key={i}
              style={{
                fontSize: "14px",
                lineHeight: "1.8",
                color: "var(--text)",
                minHeight: "24px",
              }}
            >
              {line}
            </p>
          ))}
        </div>
      ) : (
        /* Editable textarea */
        <textarea
          value={currentNote}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={`Write your notes about ${lesson.title} here...\n\nTip: Summarize key points in your own words — it helps you remember better.`}
          style={{
            flex: 1,
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            fontSize: "14px",
            lineHeight: "1.7",
            fontFamily: "inherit",
            resize: "none",
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      )}

      {/* Word count */}
      <p
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          marginTop: "8px",
          textAlign: "right",
        }}
      >
        {currentNote.trim() ? currentNote.trim().split(/\s+/).length : 0} words
      </p>
    </div>
  );
}
