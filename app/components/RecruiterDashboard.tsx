"use client";

import { useLearnerProfileQuery } from "@/lib/hooks/queries/useLearnerProfile";
import { useRecruiterDashboardData } from "@/lib/hooks/useRecruiterDashboardData";
import { cardClass } from "@/lib/ui/styles";

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
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>
          Recruiter Demo — Engineering Overview
        </h2>
        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          Architecture, AI workflows, and live TanStack Query cache for this lesson.
        </p>
      </div>

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Learning journey
        </p>
        <p className="text-[13px]" style={{ color: "var(--text)" }}>
          Learn → Practice → Review → Mock Interview
        </p>
        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          Each stage uses a different AI personality (teacher, examiner, mentor,
          senior interviewer) with the same learner profile injected into prompts.
        </p>
      </div>

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          API flow
        </p>
        <ol className="list-decimal space-y-1 pl-4 text-[12px]" style={{ color: "var(--text)" }}>
          {FLOW_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Prisma models (user data)
        </p>
        <p className="text-[12px] font-mono" style={{ color: "var(--text)" }}>
          User · Session · Message · Quiz · QuizAttempt (weakConcepts) · Summary · Note · Document · Chunk
        </p>
      </div>

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Prompt modules
        </p>
        <ul className="space-y-1 text-[12px] font-mono" style={{ color: "var(--text)" }}>
          <li>learn.ts — Teacher personality</li>
          <li>practice.ts — Examiner + checksConcept</li>
          <li>review.ts — Mentor + personalized review JSON</li>
          <li>mock-interview.ts — Senior interviewer</li>
          <li>lesson-context.ts — Metadata formatter</li>
        </ul>
      </div>

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Live learner profile
        </p>
        <pre
          className="max-h-40 overflow-auto rounded-lg p-3 text-[11px] leading-relaxed"
          style={{
            background: "var(--bg)",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
          }}
        >
          {JSON.stringify(profileData?.profile ?? {}, null, 2)}
        </pre>
      </div>

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          TanStack Query cache (this lesson)
        </p>
        <pre
          className="max-h-48 overflow-auto rounded-lg p-3 text-[11px] leading-relaxed"
          style={{
            background: "var(--bg)",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
          }}
        >
          {JSON.stringify(cacheSnapshot ?? {}, null, 2)}
        </pre>
      </div>

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Stack
        </p>
        <p className="text-[12px]" style={{ color: "var(--text)" }}>
          Next.js 16 App Router · React 19 · TanStack Query · Prisma · PostgreSQL · Groq · Cohere embeddings · Streaming SSE
        </p>
      </div>
    </div>
  );
}
