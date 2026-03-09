"use client";
import { useState } from "react";
import { Lesson } from "../data/lessons";

type Summary = {
  overview: string;
  keyPoints: string[];
  remember: string;
};

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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflowY: "auto",
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={generateSummary}
          disabled={loading}
          style={{
            padding: "10px 22px",
            borderRadius: "8px",
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
            fontFamily: "inherit",
            transition: "opacity 0.15s",
          }}
        >
          {loading
            ? "Generating Summary..."
            : summary
              ? "🔄 Regenerate Summary"
              : "✨ Generate Summary"}
        </button>
      </div>

      {loading && (
        <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          AI is summarizing the lesson...
        </div>
      )}

      {!loading && summary && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Overview */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "10px",
              }}
            >
              Overview
            </p>
            <p
              style={{
                fontSize: "14px",
                lineHeight: "1.7",
                color: "var(--text)",
              }}
            >
              {summary.overview}
            </p>
          </div>

          {/* Key Points */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "20px",
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
              Key Points
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {summary.keyPoints.map((point, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "var(--accent-soft)",
                      color: "var(--accent)",
                      fontSize: "11px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  >
                    {i + 1}
                  </span>
                  <p
                    style={{
                      fontSize: "14px",
                      lineHeight: "1.6",
                      color: "var(--text)",
                    }}
                  >
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Remember */}
          <div
            style={{
              background: "var(--accent-soft)",
              border: "1px solid var(--accent)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: "10px",
              }}
            >
              ✦ Most Important
            </p>
            <p
              style={{
                fontFamily: "Instrument Serif, serif",
                fontSize: "18px",
                lineHeight: "1.6",
                color: "var(--text)",
              }}
            >
              {summary.remember}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
