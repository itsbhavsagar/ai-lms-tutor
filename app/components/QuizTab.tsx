"use client";
import { useState, useEffect } from "react";
import { Lesson } from "../data/lessons";
import type { QuizQuestion } from "../types/quiz";
import {
  RiSparkling2Line,
  RiRefreshLine,
  RiFileTextLine,
  RiCheckLine,
  RiCloseLine,
  RiTrophyLine,
} from "react-icons/ri";
import { getOrCreateUserId } from "@/lib/utils/localStorage";

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

type QuizData = {
  id: string;
  questions: QuizQuestion[];
  attempts: { score: number; total: number }[];
  lastScore?: number;
  lastSelected?: Record<number, number>;
};

export default function QuizTab({ lesson }: { lesson: Lesson }) {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    setShowResult(false);
    setSubmitted(false);
    setSelected({});
    loadQuiz();
  }, [lesson.id]);

  async function loadQuiz() {
    try {
      setLoading(true);
      const userId = getOrCreateUserId();
      const response = await fetch(
        `/api/quiz?userId=${userId}&lessonId=${lesson.id}`,
      );
      const data = await response.json();
      if (data.quiz) {
        const attempts = data.attempts || [];
        const lastAttempt = attempts[attempts.length - 1];

        if (attempts.length > 0) {
          const savedSelected = localStorage.getItem(
            `quiz-selected-${data.quiz.id}`,
          );
          const lastSelected = savedSelected ? JSON.parse(savedSelected) : {};
          setQuizData({
            id: data.quiz.id,
            questions: data.quiz.questions,
            attempts,
            lastScore: lastAttempt?.score ?? undefined,
            lastSelected,
          });
          setSelected(lastSelected);
          setSubmitted(true);
          setShowResult(false);
        } else {
          setQuizData({
            id: data.quiz.id,
            questions: data.quiz.questions,
            attempts,
            lastScore: undefined,
            lastSelected: undefined,
          });
          setSelected({});
          setSubmitted(false);
          setShowResult(false);
        }
      } else {
        setQuizData(null);
        setSubmitted(false);
        setShowResult(false);
      }
    } catch (error) {
      console.error("Failed to load quiz:", error);
    } finally {
      setLoading(false);
    }
  }

  async function generateQuiz() {
    try {
      setGenerating(true);
      setSubmitted(false);
      setShowResult(false);
      setSelected({});
      setQuizData(null);
      const userId = getOrCreateUserId();
      await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonContent: lesson.content,
          lessonTitle: lesson.title,
          userId,
          lessonId: lesson.id,
        }),
      });
      await loadQuiz();
    } catch (error) {
      console.error("Failed to generate quiz:", error);
    } finally {
      setGenerating(false);
    }
  }

  async function submitQuiz() {
    if (!quizData) return;
    try {
      const score = quizData.questions.filter(
        (q, i) => selected[i] === q.correct,
      ).length;

      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quizData.id,
          score,
          total: quizData.questions.length,
        }),
      });

      if (response.ok) {
        localStorage.setItem(
          `quiz-selected-${quizData.id}`,
          JSON.stringify(selected),
        );
        setQuizData((prev) =>
          prev ? { ...prev, lastScore: score, lastSelected: selected } : prev,
        );
        setSubmitted(true);
        setShowResult(true);
      }
    } catch (error) {
      console.error("Failed to submit quiz:", error);
    }
  }

  function selectOption(qIndex: number, oIndex: number) {
    if (submitted) return;
    setSelected((p) => ({ ...p, [qIndex]: oIndex }));
  }

  const questions = quizData?.questions || [];
  const score =
    submitted && quizData?.lastScore !== undefined
      ? quizData.lastScore
      : questions.filter((q, i) => selected[i] === q.correct).length;
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

  const previousAttempts = quizData?.attempts || [];
  const bestPreviousScore =
    previousAttempts.length > 0
      ? Math.max(...previousAttempts.map((a) => a.score))
      : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-none items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h2
            className="text-[15px] font-semibold"
            style={{ color: "var(--text)" }}
          >
            {generating
              ? LABEL_GENERATING
              : questions.length > 0
                ? `${questions.length} ${LABEL_QUESTIONS}`
                : "Quiz"}
          </h2>
          {!generating && questions.length > 0 && !submitted && (
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              {answered} / {questions.length} {LABEL_ANSWERED}
            </p>
          )}
          {submitted && !generating && (
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              {score} / {questions.length} {LABEL_CORRECT}
            </p>
          )}
          {bestPreviousScore !== null && !submitted && !generating && (
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              Previous best:{" "}
              <span style={{ color: "var(--green)", fontWeight: 600 }}>
                {bestPreviousScore}/{questions.length}
              </span>
            </p>
          )}
        </div>

        <button
          onClick={generateQuiz}
          disabled={generating}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-opacity"
          style={{
            background: "var(--accent)",
            opacity: generating ? 0.55 : 1,
            cursor: generating ? "not-allowed" : "pointer",
          }}
        >
          {questions.length > 0 ? (
            <RiRefreshLine size={14} />
          ) : (
            <RiSparkling2Line size={14} />
          )}
          {generating
            ? LABEL_GENERATING
            : questions.length > 0
              ? LABEL_REGENERATE
              : LABEL_GENERATE}
        </button>
      </div>

      {loading && !questions.length ? (
        <div
          className="flex flex-1 flex-col items-center justify-center gap-3"
          style={{ color: "var(--text-muted)" }}
        >
          Loading...
        </div>
      ) : !generating && questions.length === 0 ? (
        <div
          className="flex flex-1 flex-col items-center justify-center gap-3"
          style={{ color: "var(--text-muted)" }}
        >
          <RiFileTextLine size={32} style={{ opacity: 0.35 }} />
          <p className="text-[13px]">{LABEL_EMPTY}</p>
        </div>
      ) : null}

      {showResult && quizData && (
        <div
          className="w-full flex-none rounded-xl border p-6 text-center"
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

      {!generating && questions.length > 0 && (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-4 pb-2">
            {previousAttempts.length > 1 && submitted && (
              <div
                className="rounded-xl border p-4"
                style={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold"
                  style={{ color: "var(--text-muted)" }}
                >
                  <RiTrophyLine size={13} />
                  Past attempts
                </p>
                <div className="flex flex-col gap-1.5">
                  {previousAttempts.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-[12px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span>Attempt {i + 1}</span>
                      <span
                        style={{
                          color:
                            a.score === a.total
                              ? "var(--green)"
                              : "var(--text-muted)",
                          fontWeight: a.score === a.total ? 600 : 400,
                        }}
                      >
                        {a.score}/{a.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                    const wasSelected =
                      submitted &&
                      quizData?.lastSelected &&
                      quizData.lastSelected[qIndex] === oIndex;

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
                      } else if (wasSelected || isSelected) {
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

            {!submitted && (
              <button
                onClick={submitQuiz}
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
