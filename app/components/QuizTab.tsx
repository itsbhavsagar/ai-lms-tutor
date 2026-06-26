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
import {
  breakAnywhereClass,
  panelHeadingClass,
  panelSubtextClass,
  quizOptionCorrectClass,
  quizOptionDefaultClass,
  quizOptionDimmedClass,
  quizOptionSelectedClass,
  quizOptionWrongClass,
} from "@/lib/ui/styles";

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
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 sm:gap-4">
      <div className="flex min-w-0 flex-none items-start justify-between gap-2">
        <div className="min-w-0 flex flex-1 flex-col gap-0.5">
          <h2 className={panelHeadingClass}>
            {generating
              ? LABEL_GENERATING
              : questions.length > 0
                ? `${questions.length} ${LABEL_QUESTIONS}`
                : LABEL_HEADING}
          </h2>
          {!generating && questions.length > 0 && !submitted && (
            <p className={panelSubtextClass}>
              {answered} / {questions.length} {LABEL_ANSWERED}
            </p>
          )}
          {submitted && !generating && (
            <p className={panelSubtextClass}>
              {score} / {questions.length} {LABEL_CORRECT}
            </p>
          )}
          {bestPreviousScore !== null && !submitted && !generating && (
            <p className={panelSubtextClass}>
              Previous best:{" "}
              <span className="font-semibold text-green">
                {bestPreviousScore}/{questions.length}
              </span>
            </p>
          )}
        </div>

        <PrimaryButton
          onClick={handleGenerateQuiz}
          disabled={generating}
          className="shrink-0 whitespace-nowrap px-2.5 py-1.5 text-[12px] sm:px-4 sm:py-2.5 sm:text-[13px]"
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
        <div className="w-full flex-none rounded-xl border border-accent-border bg-accent-soft p-4 text-center sm:p-6">
          <p className="mb-1 text-4xl font-bold text-ink sm:text-5xl">
            {pct}%
          </p>
          <p className="text-[13px] font-medium text-ink">
            {score} / {questions.length} {LABEL_CORRECT}
          </p>
          <p className="mt-1 text-[12px] text-muted">
            {feedbackMsg}
          </p>
        </div>
      )}

      {!generating && questions.length > 0 && (
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="flex min-w-0 flex-col gap-3 pb-2 sm:gap-4">
            {previousAttempts.length > 1 && submitted && (
              <div className="rounded-xl border border-border bg-surface-raised p-4">
                <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                  <RiTrophyLine size={13} />
                  Past attempts
                </p>
                <div className="flex flex-col gap-1.5">
                  {previousAttempts.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 text-[12px] text-muted"
                    >
                      <span>Attempt {i + 1}</span>
                      <span
                        className={
                          a.score === a.total
                            ? "font-semibold text-green"
                            : "font-normal text-muted"
                        }
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
                className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface-raised p-3 shadow-sm sm:gap-4 sm:p-5"
              >
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-on-accent">
                      {qIndex + 1}
                    </span>
                    {q.difficulty && (
                      <span className="shrink-0 rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium uppercase text-accent">
                        {q.difficulty}
                      </span>
                    )}
                  </div>
                  <p
                    className={`${breakAnywhereClass} text-[13px] font-semibold leading-snug text-ink sm:text-[14px]`}
                  >
                    {q.question}
                  </p>
                </div>

                {q.checksConcept && (
                  <p
                    className={`${breakAnywhereClass} text-[11px] leading-snug text-muted`}
                  >
                    Checks your understanding of{" "}
                    <span className="font-medium text-accent">
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

                    let optionClass = quizOptionDefaultClass;
                    let Icon = null as React.ReactNode;

                    if (submitted) {
                      if (isCorrect) {
                        optionClass = quizOptionCorrectClass;
                        Icon = <RiCheckLine size={14} />;
                      } else if (wasSelected || isSelected) {
                        optionClass = quizOptionWrongClass;
                        Icon = <RiCloseLine size={14} />;
                      } else {
                        optionClass = `${quizOptionDimmedClass} border-border bg-panel`;
                      }
                    } else if (isSelected) {
                      optionClass = quizOptionSelectedClass;
                    }

                    return (
                      <button
                        key={oIndex}
                        onClick={() => selectOption(qIndex, oIndex)}
                        className={`flex w-full min-w-0 items-start justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-[12px] leading-snug transition-all duration-100 sm:gap-3 sm:px-4 sm:text-[13px] ${optionClass}`}
                      >
                        <span
                          className={`${breakAnywhereClass} flex-1 font-mono text-[11px] sm:font-sans sm:text-[13px]`}
                        >
                          {option}
                        </span>
                        {Icon && <span className="mt-0.5 shrink-0">{Icon}</span>}
                      </button>
                    );
                  })}
                </div>

                {submitted && q.explanation && (
                  <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-raised p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-green">
                      Explanation
                    </p>
                    <p
                      className={`${breakAnywhereClass} text-[12px] leading-relaxed text-ink`}
                    >
                      {q.explanation}
                    </p>
                    {q.interviewTakeaway && (
                      <p
                        className={`${breakAnywhereClass} text-[12px] leading-relaxed text-muted`}
                      >
                        <span className="font-semibold text-accent">
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
