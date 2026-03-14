"use client";
import { useState } from "react";
import { Lesson } from "../data/lessons";
import type { QuizQuestion } from "../types/quiz";
import {
  RiSparkling2Line,
  RiRefreshLine,
  RiFileTextLine,
  RiCheckLine,
  RiCloseLine,
} from "react-icons/ri";

const LABEL_GENERATE = "Generate Quiz";
const LABEL_REGENERATE = "Regenerate";
const LABEL_GENERATING = "Generating…";
const LABEL_SUBMIT = "Submit Quiz";
const LABEL_QUESTIONS = "Questions";
const LABEL_ANSWERED = "answered";
const LABEL_CORRECT = "correct";
const LABEL_EMPTY = "Generate a quiz to test your knowledge";
const FEEDBACK_PERFECT = "Perfect score!";
const FEEDBACK_GOOD = "Good job! Review the ones you missed.";
const FEEDBACK_LOW = "Study more and try again.";

export default function QuizTab({ lesson }: { lesson: Lesson }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
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
    setSelected((p) => ({ ...p, [qIndex]: oIndex }));
  }

  const score = questions.filter((q, i) => selected[i] === q.correct).length;
  const answered = Object.keys(selected).length;
  const pct = questions.length
    ? Math.round((score / questions.length) * 100)
    : 0;

  const feedbackMsg =
    score === questions.length
      ? FEEDBACK_PERFECT
      : score >= questions.length / 2
        ? FEEDBACK_GOOD
        : FEEDBACK_LOW;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-none items-center justify-between">
        <div>
          <h2
            className="text-[15px] font-semibold"
            style={{ color: "var(--text)" }}
          >
            {loading
              ? LABEL_GENERATING
              : questions.length > 0
                ? `${questions.length} ${LABEL_QUESTIONS}`
                : "Quiz"}
          </h2>
          {!loading && questions.length > 0 && !submitted && (
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              {answered} / {questions.length} {LABEL_ANSWERED}
            </p>
          )}
        </div>

        <button
          onClick={generateQuiz}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-opacity"
          style={{
            background: "var(--accent)",
            opacity: loading ? 0.55 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (
            <RiSparkling2Line size={14} />
          ) : questions.length > 0 ? (
            <RiRefreshLine size={14} />
          ) : (
            <RiSparkling2Line size={14} />
          )}
          {loading
            ? LABEL_GENERATING
            : questions.length > 0
              ? LABEL_REGENERATE
              : LABEL_GENERATE}
        </button>
      </div>

      {!loading && questions.length === 0 && (
        <div
          className="flex flex-1 flex-col items-center justify-center gap-3"
          style={{ color: "var(--text-muted)" }}
        >
          <RiFileTextLine size={32} style={{ opacity: 0.35 }} />
          <p className="text-[13px]">{LABEL_EMPTY}</p>
        </div>
      )}

      {!loading && questions.length > 0 && (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-4 pb-2">
            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="rounded-xl border p-5"
                style={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  className="mb-4 flex items-start gap-2.5 text-[13px] font-semibold leading-snug"
                  style={{ color: "var(--text)" }}
                >
                  <span
                    className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: "var(--accent)" }}
                  >
                    {qIndex + 1}
                  </span>
                  {q.question}
                </p>

                <div className="flex flex-col gap-2">
                  {q.options.map((option, oIndex) => {
                    const isSelected = selected[qIndex] === oIndex;
                    const isCorrect = q.correct === oIndex;

                    let bg = "var(--bg-panel)";
                    let border = "var(--border)";
                    let color = "var(--text)";
                    let Icon = null as React.ReactNode;

                    if (submitted) {
                      if (isCorrect) {
                        bg = "var(--green-soft)";
                        border = "var(--green-border)";
                        color = "var(--green)";
                        Icon = <RiCheckLine size={14} />;
                      } else if (isSelected) {
                        bg = "var(--red-soft)";
                        border = "var(--red-border)";
                        color = "var(--red)";
                        Icon = <RiCloseLine size={14} />;
                      } else {
                        color = "var(--text-muted)";
                      }
                    } else if (isSelected) {
                      bg = "var(--text)";
                      border = "var(--text)";
                      color = "#fff";
                    }

                    return (
                      <button
                        key={oIndex}
                        onClick={() => selectOption(qIndex, oIndex)}
                        className="flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left text-[13px] leading-snug transition-all duration-100"
                        style={{
                          background: bg,
                          border: `1px solid ${border}`,
                          color,
                          cursor: submitted ? "default" : "pointer",
                        }}
                      >
                        <span>{option}</span>
                        {Icon && <span className="shrink-0">{Icon}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {!submitted ? (
              <button
                onClick={() => setSubmitted(true)}
                disabled={answered < questions.length}
                className="self-start rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity"
                style={{
                  background: "var(--accent)",
                  opacity: answered < questions.length ? 0.4 : 1,
                  cursor:
                    answered < questions.length ? "not-allowed" : "pointer",
                }}
              >
                {LABEL_SUBMIT}
              </button>
            ) : (
              <div
                className="rounded-xl border p-6 text-center"
                style={{
                  background: "var(--accent-soft)",
                  border: "1px solid var(--accent-border)",
                }}
              >
                <p
                  className="mb-1 text-5xl font-bold"
                  style={{ fontFamily: "'Lora', serif", color: "var(--text)" }}
                >
                  {pct}%
                </p>
                <p
                  className="text-[13px] font-medium"
                  style={{ color: "var(--text)" }}
                >
                  {score} / {questions.length} {LABEL_CORRECT}
                </p>
                <p
                  className="mt-1 text-[12px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {feedbackMsg}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
