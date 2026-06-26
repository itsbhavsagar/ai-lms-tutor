"use client";

import { useLearnerProfileQuery } from "@/lib/hooks/queries/useLearnerProfile";
import { useRecruiterDashboardData } from "@/lib/hooks/useRecruiterDashboardData";
import { cardClass, panelHeadingClass, panelSubtextClass } from "@/lib/ui/styles";

const FLOW_STEPS = [
  "Lesson metadata (lib/curriculum)",
  "Learner profile (Prisma: quizzes, notes, sessions)",
  "Prompt builder (lib/ai/prompts/*)",
  "Groq llama-3.1-8b-instant (stream or JSON)",
  "Persist: Summary, Quiz, Messages",
];

export default function RecruiterDashboard({ lessonId }: { lessonId: string }) {
  const { data: profileData } = useLearnerProfileQuery(lessonId);
  const { cacheSnapshot } = useRecruiterDashboardData(lessonId);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2">
      <div>
        <h2 className={panelHeadingClass}>
          Recruiter Demo — Engineering Overview
        </h2>
        <p className={panelSubtextClass}>
          Architecture, AI workflows, and live TanStack Query cache for this lesson.
        </p>
      </div>

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          Learning journey
        </p>
        <p className="text-[13px] text-ink">
          Learn → Practice → Review → Mock Interview
        </p>
        <p className="text-[12px] text-muted">
          Each stage uses a different AI personality (teacher, examiner, mentor,
          senior interviewer) with the same learner profile injected into prompts.
        </p>
      </div>

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          API flow
        </p>
        <ol className="list-decimal space-y-1 pl-4 text-[12px] text-ink">
          {FLOW_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          Prisma models (user data)
        </p>
        <p className="text-[12px] font-mono text-ink">
          User · Session · Message · Quiz · QuizAttempt (weakConcepts) · Summary · Note · Document · Chunk
        </p>
      </div>

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          Prompt modules
        </p>
        <ul className="space-y-1 text-[12px] font-mono text-ink">
          <li>learn.ts — Teacher personality</li>
          <li>practice.ts — Examiner + checksConcept</li>
          <li>review.ts — Mentor + personalized review JSON</li>
          <li>mock-interview.ts — Senior interviewer</li>
          <li>lesson-context.ts — Metadata formatter</li>
        </ul>
      </div>

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          Live learner profile
        </p>
        <pre className="max-h-40 overflow-auto rounded-lg border border-border bg-canvas p-3 text-[11px] leading-relaxed text-muted">
          {JSON.stringify(profileData?.profile ?? {}, null, 2)}
        </pre>
      </div>

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          TanStack Query cache (this lesson)
        </p>
        <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-canvas p-3 text-[11px] leading-relaxed text-muted">
          {JSON.stringify(cacheSnapshot ?? {}, null, 2)}
        </pre>
      </div>

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          Stack
        </p>
        <p className="text-[12px] text-ink">
          Next.js 16 App Router · React 19 · TanStack Query · Prisma · PostgreSQL · Groq · Cohere embeddings · Streaming SSE
        </p>
      </div>
    </div>
  );
}
