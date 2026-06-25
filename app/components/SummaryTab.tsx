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
import EmptyState from "./ui/EmptyState";
import PrimaryButton from "./ui/PrimaryButton";
import { SkeletonSummary } from "./ui/Skeleton";
import { cardClass, panelHeadingClass } from "@/lib/ui/styles";

const LABEL_GENERATE = "Generate Summary";
const LABEL_REGENERATE = "Regenerate";
const LABEL_GENERATING = "Generating…";
const LABEL_OVERVIEW = "Overview";
const LABEL_KEY_POINTS = "Key Points";
const LABEL_IMPORTANT = "Most Important";
const LABEL_EMPTY = "Generate a summary to review key concepts";
const LABEL_HEADING = "AI Summary";

export default function SummaryTab({ lesson }: { lesson: Lesson }) {
  const { data, isLoading } = useSummaryQuery(lesson.id);
  const generateMutation = useGenerateSummaryMutation(lesson);

  const summary = data?.summary ?? null;
  const generating = generateMutation.isPending;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2
          className={panelHeadingClass}
          style={{ color: "var(--text)" }}
        >
          {generating ? LABEL_GENERATING : LABEL_HEADING}
        </h2>
        <PrimaryButton
          onClick={() => generateMutation.mutate()}
          disabled={generating}
          fullWidth
        >
          {summary ? (
            <RiRefreshLine size={14} />
          ) : (
            <RiSparkling2Line size={14} />
          )}
          {generating
            ? LABEL_GENERATING
            : summary
              ? LABEL_REGENERATE
              : LABEL_GENERATE}
        </PrimaryButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-0 sm:pr-1">
        {isLoading && !summary ? (
          <SkeletonSummary />
        ) : generating && !summary ? (
          <SkeletonSummary />
        ) : !generating && !summary ? (
          <EmptyState
            icon={<RiBookOpenLine size={22} />}
            title="No summary yet"
            description={LABEL_EMPTY}
            fill
          />
        ) : null}

        {!generating && summary && (
          <div className="flex flex-col gap-4 pb-2">
            <div className={`${cardClass} flex flex-col gap-3`}>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                {LABEL_OVERVIEW}
              </p>
              <p
                className="break-words text-[13px] leading-relaxed"
                style={{ color: "var(--text)" }}
              >
                {summary.overview}
              </p>
            </div>

            <div className={`${cardClass} flex flex-col gap-4`}>
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
                      className="min-w-0 flex-1 break-words text-[13px] leading-relaxed"
                      style={{ color: "var(--text)" }}
                    >
                      {pt}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl border p-4 sm:p-5"
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
                className="break-words text-[14px] leading-relaxed sm:text-[15px]"
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
