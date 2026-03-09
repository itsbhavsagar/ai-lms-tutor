"use client";
import { useState } from "react";
import { Lesson } from "../data/lessons";

type Question = {
  question: string;
  options: string[];
  correct: number;
};

export default function QuizTab({ lesson }: { lesson: Lesson }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  async function generateQuiz() {
    setLoading(true);
    setSelected({});
    setSubmitted(false);
    setQuestions([]);

    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonContent: lesson.content,
        lessonTitle: lesson.title,
      }),
    });

    const data = await res.json();
    setQuestions(data.questions);
    setLoading(false);
  }

  function selectOption(qIndex: number, oIndex: number) {
    if (submitted) return;
    setSelected((prev) => ({ ...prev, [qIndex]: oIndex }));
  }

  function getScore() {
    return questions.filter((q, i) => selected[i] === q.correct).length;
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
      {/* Generate Button */}
      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={generateQuiz}
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
            ? "Generating Quiz..."
            : questions.length > 0
              ? "🔄 Regenerate Quiz"
              : "✨ Generate Quiz"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          AI is generating your quiz...
        </div>
      )}

      {/* Questions */}
      {!loading && questions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "20px",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: "14px",
                  lineHeight: "1.5",
                }}
              >
                {qIndex + 1}. {q.question}
              </p>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {q.options.map((option, oIndex) => {
                  const isSelected = selected[qIndex] === oIndex;
                  const isCorrect = q.correct === oIndex;

                  let styleObj: React.CSSProperties = {
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--surface2)",
                    color: "var(--text)",
                    fontSize: "14px",
                    cursor: submitted ? "default" : "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                    lineHeight: "1.5",
                  };

                  if (submitted) {
                    if (isCorrect)
                      styleObj = {
                        ...styleObj,
                        background: "var(--green-soft)",
                        color: "var(--green)",
                        borderColor: "var(--green)",
                      };
                    else if (isSelected && !isCorrect)
                      styleObj = {
                        ...styleObj,
                        background: "var(--red-soft)",
                        color: "var(--red)",
                        borderColor: "var(--red)",
                      };
                    else styleObj = { ...styleObj, opacity: 0.5 };
                  } else if (isSelected) {
                    styleObj = {
                      ...styleObj,
                      background: "var(--accent-soft)",
                      color: "var(--accent)",
                      borderColor: "var(--accent)",
                    };
                  }

                  return (
                    <button
                      key={oIndex}
                      onClick={() => selectOption(qIndex, oIndex)}
                      style={styleObj}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Submit / Score */}
          {!submitted ? (
            <button
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(selected).length < questions.length}
              style={{
                padding: "11px 24px",
                borderRadius: "8px",
                border: "none",
                background: "var(--green)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 500,
                cursor:
                  Object.keys(selected).length < questions.length
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  Object.keys(selected).length < questions.length ? 0.4 : 1,
                fontFamily: "inherit",
                transition: "opacity 0.15s",
                alignSelf: "flex-start",
              }}
            >
              Submit Quiz
            </button>
          ) : (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "28px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "Instrument Serif, serif",
                  fontSize: "42px",
                  fontWeight: 400,
                  color: "var(--text)",
                  marginBottom: "6px",
                }}
              >
                {getScore()} / {questions.length}
              </p>
              <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                {getScore() === questions.length
                  ? "🎉 Perfect score!"
                  : getScore() >= questions.length / 2
                    ? "👍 Good job! Review the wrong answers."
                    : "📖 Study more and try again."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
