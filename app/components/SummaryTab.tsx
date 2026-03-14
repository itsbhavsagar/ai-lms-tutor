"use client";
import { useState } from "react";
import { Lesson } from "../data/lessons";
import {
  RiSparkling2Line,
  RiRefreshLine,
  RiBookOpenLine,
} from "react-icons/ri";

type Summary = {
  overview: string;
  keyPoints: string[];
  remember: string;
};

const LABEL_GENERATE = "Generate Summary";
const LABEL_REGENERATE = "Regenerate";
const LABEL_GENERATING = "Generating…";
const LABEL_OVERVIEW = "Overview";
const LABEL_KEY_POINTS = "Key Points";
const LABEL_IMPORTANT = "Most Important";
const LABEL_EMPTY = "Generate a summary to review key concepts";
const LABEL_HEADING = "AI Summary";

export default function SummaryTab({ lesson }: { lesson: Lesson }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  async function generateSummary() {
    setLoading(true);
    setSummary(null);
    const res = await fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonContent: lesson.content,
        lessonTitle: lesson.title,
      }),
    });
    const data = await res.json();
    setSummary(data);
    setLoading(false);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-none items-center justify-between">
        <h2
          className="text-[15px] font-semibold"
          style={{ color: "var(--text)" }}
        >
          {loading ? LABEL_GENERATING : LABEL_HEADING}
        </h2>
        <button
          onClick={generateSummary}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-opacity"
          style={{
            background: "var(--accent)",
            opacity: loading ? 0.55 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {summary ? (
            <RiRefreshLine size={14} />
          ) : (
            <RiSparkling2Line size={14} />
          )}
          {loading
            ? LABEL_GENERATING
            : summary
              ? LABEL_REGENERATE
              : LABEL_GENERATE}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {!loading && !summary && (
          <div
            className="flex h-full flex-col items-center justify-center gap-3"
            style={{ color: "var(--text-muted)" }}
          >
            <RiBookOpenLine size={32} style={{ opacity: 0.35 }} />
            <p className="text-[13px]">{LABEL_EMPTY}</p>
          </div>
        )}

        {!loading && summary && (
          <div className="flex flex-col gap-4 pb-2">
            <div
              className="rounded-xl border p-5"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="mb-2 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                {LABEL_OVERVIEW}
              </p>
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: "var(--text)" }}
              >
                {summary.overview}
              </p>
            </div>

            <div
              className="rounded-xl border p-5"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="mb-4 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                {LABEL_KEY_POINTS}
              </p>
              <div className="flex flex-col gap-3">
                {summary.keyPoints.map((pt, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: "var(--accent)" }}
                    >
                      {i + 1}
                    </span>
                    <p
                      className="text-[13px] leading-relaxed"
                      style={{ color: "var(--text)" }}
                    >
                      {pt}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl border p-5"
              style={{
                background: "var(--accent-soft)",
                border: "1px solid var(--accent-border)",
                borderLeftWidth: 3,
                borderLeftColor: "var(--accent)",
              }}
            >
              <p
                className="mb-2 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--accent)" }}
              >
                {LABEL_IMPORTANT}
              </p>
              <p
                className="text-[15px] leading-relaxed"
                style={{
                  color: "var(--text)",
                  fontFamily: "'Lora', serif",
                  fontStyle: "italic",
                }}
              >
                {summary.remember}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
