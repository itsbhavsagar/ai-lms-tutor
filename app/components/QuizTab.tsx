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
  RiTrophyLine,
} from "react-icons/ri";
import {
  useGenerateQuizMutation,
  useQuizQuery,
  useSubmitQuizMutation,
} from "@/lib/hooks/queries/useQuiz";
import type { QuizGetResponse } from "@/lib/api/quiz";
import EmptyState from "./ui/EmptyState";
import PrimaryButton from "./ui/PrimaryButton";
import { SkeletonQuiz } from "./ui/Skeleton";
import { cardClass, panelHeadingClass, panelSubtextClass } from "@/lib/ui/styles";

const LABEL_GENERATE = "Generate Quiz";
const LABEL_REGENERATE = "Regenerate";
const LABEL_GENERATING = "Generating…";
const LABEL_SUBMIT = "Submit Quiz";
const LABEL_QUESTIONS = "Questions";
const LABEL_ANSWERED = "answered";
const LABEL_CORRECT = "correct";
const LABEL_EMPTY = "AI generates practice questions from your learner profile";
const LABEL_HEADING = "Practice";
const FEEDBACK_PERFECT = "Perfect score!";
const FEEDBACK_GOOD = "Good job! Review the ones you missed.";
const FEEDBACK_LOW = "Study more and try again.";

type QuizViewModel = {
  id: string;
  questions: QuizQuestion[];
  attempts: { score: number; total: number }[];
  lastScore?: number;
  lastSelected?: Record<number, number>;
};

function buildQuizViewModel(data: QuizGetResponse | undefined): QuizViewModel | null {
  if (!data?.quiz) return null;

  const attempts = data.attempts || [];
  const lastAttempt = attempts[0];
  let lastSelected: Record<number, number> = {};

  if (attempts.length > 0) {
    const savedSelected = localStorage.getItem(`quiz-selected-${data.quiz.id}`);
    try {
      lastSelected = savedSelected ? JSON.parse(savedSelected) : {};
    } catch {
      lastSelected = {};
    }
  }

  return {
    id: data.quiz.id,
    questions: data.quiz.questions,
    attempts,
    lastScore: lastAttempt?.score,
    lastSelected: attempts.length > 0 ? lastSelected : undefined,
  };
}

export default function QuizTab({ lesson }: { lesson: Lesson }) {
  const { data, isLoading } = useQuizQuery(lesson.id);
  const generateMutation = useGenerateQuizMutation(lesson.id);
  const submitMutation = useSubmitQuizMutation(lesson.id);

  const [draftSelected, setDraftSelected] = useState<Record<number, number>>({});
  const [draftSubmitted, setDraftSubmitted] = useState(false);

  const quizData = buildQuizViewModel(data);
  const hasAttempts = (quizData?.attempts.length ?? 0) > 0;
  const selected = hasAttempts ? (quizData?.lastSelected ?? {}) : draftSelected;
  const submitted = hasAttempts || draftSubmitted;

  const generating = generateMutation.isPending;
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

  function handleGenerateQuiz() {
    setDraftSubmitted(false);
    setDraftSelected({});
    generateMutation.mutate();
  }

  function handleSubmitQuiz() {
    if (!quizData) return;

    const weakConcepts = quizData.questions
      .filter((q, i) => selected[i] !== undefined && selected[i] !== q.correct)
      .map((q) => q.checksConcept ?? q.question.slice(0, 60))
      .filter(Boolean);

    const nextScore = quizData.questions.filter(
      (q, i) => selected[i] === q.correct,
    ).length;

    submitMutation.mutate(
      {
        quizId: quizData.id,
        score: nextScore,
        total: quizData.questions.length,
        weakConcepts,
      },
      {
        onSuccess: () => {
          localStorage.setItem(
            `quiz-selected-${quizData.id}`,
            JSON.stringify(selected),
          );
          setDraftSubmitted(true);
        },
      },
    );
  }

  function selectOption(qIndex: number, oIndex: number) {
    if (submitted) return;
    setDraftSelected((p) => ({ ...p, [qIndex]: oIndex }));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex flex-col gap-0.5">
          <h2
            className={panelHeadingClass}
            style={{ color: "var(--text)" }}
          >
            {generating
              ? LABEL_GENERATING
              : questions.length > 0
                ? `${questions.length} ${LABEL_QUESTIONS}`
                : LABEL_HEADING}
          </h2>
          {!generating && questions.length > 0 && !submitted && (
            <p className={panelSubtextClass} style={{ color: "var(--text-muted)" }}>
              {answered} / {questions.length} {LABEL_ANSWERED}
            </p>
          )}
          {submitted && !generating && (
            <p className={panelSubtextClass} style={{ color: "var(--text-muted)" }}>
              {score} / {questions.length} {LABEL_CORRECT}
            </p>
          )}
          {bestPreviousScore !== null && !submitted && !generating && (
            <p className={panelSubtextClass} style={{ color: "var(--text-muted)" }}>
              Previous best:{" "}
              <span style={{ color: "var(--green)", fontWeight: 600 }}>
                {bestPreviousScore}/{questions.length}
              </span>
            </p>
          )}
        </div>

        <PrimaryButton
          onClick={handleGenerateQuiz}
          disabled={generating}
          fullWidth
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
        </PrimaryButton>
      </div>

      {isLoading && !quizData ? (
        <SkeletonQuiz />
      ) : generating && questions.length === 0 ? (
        <SkeletonQuiz />
      ) : !generating && questions.length === 0 ? (
        <EmptyState
          icon={<RiFileTextLine size={22} />}
          title="No quiz yet"
          description={LABEL_EMPTY}
          fill
        />
      ) : null}

      {submitted && quizData && questions.length > 0 && !generating && (
        <div
          className="w-full flex-none rounded-xl border p-4 text-center sm:p-6"
          style={{
            background: "var(--accent-soft)",
            border: "1px solid var(--accent-border)",
          }}
        >
          <p
            className="mb-1 text-4xl font-bold sm:text-5xl"
            style={{ color: "var(--text)" }}
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
        <div className="min-h-0 flex-1 overflow-y-auto pr-0 sm:pr-1">
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
                      className="flex items-center justify-between gap-3 text-[12px]"
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
                className={`${cardClass} flex flex-col gap-4`}
              >
                <p
                  className="flex items-start gap-2.5 text-[13px] font-semibold leading-snug"
                  style={{ color: "var(--text)" }}
                >
                  <span
                    className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: "var(--accent)" }}
                  >
                    {qIndex + 1}
                  </span>
                  <span className="min-w-0 flex-1 wrap-break-word">
                    {q.question}
                  </span>
                  {q.difficulty && (
                    <span
                      className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase"
                      style={{
                        background: "var(--accent-soft)",
                        color: "var(--accent)",
                      }}
                    >
                      {q.difficulty}
                    </span>
                  )}
                </p>

                {q.checksConcept && (
                  <p
                    className="text-[11px] leading-snug"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Checks your understanding of{" "}
                    <span className="font-medium" style={{ color: "var(--accent)" }}>
                      {q.checksConcept}
                    </span>
                  </p>
                )}

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
                      bg = "var(--selection-bg)";
                      border = "var(--selection-bg)";
                      color = "var(--selection-fg)";
                    }

                    return (
                      <button
                        key={oIndex}
                        onClick={() => selectOption(qIndex, oIndex)}
                        className="flex w-full items-start justify-between gap-3 rounded-lg border px-4 py-2.5 text-left text-[13px] leading-snug transition-all duration-100"
                        style={{
                          background: bg,
                          border: `1px solid ${border}`,
                          color,
                          cursor: submitted ? "default" : "pointer",
                        }}
                      >
                        <span className="min-w-0 flex-1 wrap-wrap-wrap-break-word">
                          {option}
                        </span>
                        {Icon && <span className="mt-0.5 shrink-0">{Icon}</span>}
                      </button>
                    );
                  })}
                </div>

                {submitted && q.explanation && (
                  <div
                    className="flex flex-col gap-2 rounded-lg border p-3"
                    style={{
                      background: "var(--surface-raised)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <p
                      className="text-[11px] font-semibold uppercase tracking-wide"
                      style={{ color: "var(--green)" }}
                    >
                      Explanation
                    </p>
                    <p
                      className="text-[12px] leading-relaxed"
                      style={{ color: "var(--text)" }}
                    >
                      {q.explanation}
                    </p>
                    {q.interviewTakeaway && (
                      <p
                        className="text-[12px] leading-relaxed"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <span className="font-semibold" style={{ color: "var(--accent)" }}>
                          Interview takeaway:{" "}
                        </span>
                        {q.interviewTakeaway}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {!submitted && (
              <PrimaryButton
                onClick={handleSubmitQuiz}
                disabled={
                  answered < questions.length || submitMutation.isPending
                }
                fullWidth
                className="sm:self-start"
              >
                {LABEL_SUBMIT}
              </PrimaryButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
