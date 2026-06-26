"use client";
import { Lesson } from "../data/lessons";
import {
  RiSparkling2Line,
  RiRefreshLine,
  RiBookOpenLine,
} from "react-icons/ri";
import {
  useGenerateSummaryMutation,
  useSummaryQuery,
} from "@/lib/hooks/queries/useSummary";
import {
  isPersonalizedReview,
  type PersonalizedReview,
} from "@/app/types/summary";
import EmptyState from "./ui/EmptyState";
import PrimaryButton from "./ui/PrimaryButton";
import { SkeletonSummary } from "./ui/Skeleton";
import { cardClass, panelHeadingClass, scrollAreaClass } from "@/lib/ui/styles";

const LABEL_GENERATE = "Generate Review";
const LABEL_REGENERATE = "Regenerate";
const LABEL_GENERATING = "Generating…";
const LABEL_EMPTY =
  "AI builds a personalized review from your quiz gaps and learner profile";
const LABEL_HEADING = "Your Review";

function PersonalizedReviewView({ review }: { review: PersonalizedReview }) {
  return (
    <div className="flex flex-col gap-4 pb-2">
      {review.mentorNote && (
        <div className="rounded-xl border border-accent-border bg-accent-soft p-4">
          <p className="text-[13px] leading-relaxed text-ink">
            {review.mentorNote}
          </p>
        </div>
      )}

      <div className={`${cardClass} flex flex-col gap-3`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-green">
          You understood
        </p>
        <ul className="space-y-1.5">
          {review.understood.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-ink">
              <span className="text-green">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {review.struggled.length > 0 && (
        <div className={`${cardClass} flex flex-col gap-3`}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-red">
            You struggled with
          </p>
          <ul className="space-y-1.5">
            {review.struggled.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-ink">
                <span className="text-red">✗</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {review.suggestedRevision && (
        <div className={`${cardClass} flex flex-col gap-2`}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
            Suggested revision
          </p>
          <p className="text-[13px] font-medium text-ink">
            {review.suggestedRevision}
          </p>
          <p className="text-[12px] text-muted">
            ~{review.revisionMinutes} minutes
          </p>
        </div>
      )}

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          Common interview mistake
        </p>
        <p className="text-[13px] leading-relaxed text-ink">
          {review.commonInterviewMistake}
        </p>
      </div>

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          Production example
        </p>
        <p className="text-[13px] leading-relaxed text-ink">
          {review.productionExample}
        </p>
      </div>
    </div>
  );
}

export default function SummaryTab({ lesson }: { lesson: Lesson }) {
  const { data, isLoading } = useSummaryQuery(lesson.id);
  const generateMutation = useGenerateSummaryMutation(lesson.id);

  const review = data?.summary ?? null;
  const generating = generateMutation.isPending;
  const personalized =
    review &&
    typeof review === "object" &&
    isPersonalizedReview(review as Record<string, unknown>);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className={panelHeadingClass}>
            {generating ? LABEL_GENERATING : LABEL_HEADING}
          </h2>
          <p className="text-[12px] text-muted">
            Mentor-mode review personalized to your quiz and activity
          </p>
        </div>
        <PrimaryButton
          onClick={() => generateMutation.mutate()}
          disabled={generating}
          fullWidth
        >
          {review ? (
            <RiRefreshLine size={14} />
          ) : (
            <RiSparkling2Line size={14} />
          )}
          {generating
            ? LABEL_GENERATING
            : review
              ? LABEL_REGENERATE
              : LABEL_GENERATE}
        </PrimaryButton>
      </div>

      <div className={`${scrollAreaClass} pr-0 sm:pr-1`}>
        {isLoading && !review ? (
          <SkeletonSummary />
        ) : generating && !review ? (
          <SkeletonSummary />
        ) : !generating && !review ? (
          <EmptyState
            icon={<RiBookOpenLine size={22} />}
            title="No review yet"
            description={LABEL_EMPTY}
            fill
          />
        ) : null}

        {!generating && personalized && (
          <PersonalizedReviewView review={review as PersonalizedReview} />
        )}

        {!generating && review && !personalized && (
          <p className="text-[13px] text-muted">
            Regenerate to get a personalized review based on your latest activity.
          </p>
        )}
      </div>
    </div>
  );
}
