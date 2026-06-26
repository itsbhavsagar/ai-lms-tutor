"use client";

import { useLearnerProfileQuery } from "@/lib/hooks/queries/useLearnerProfile";
import { useRecruiterDashboardData } from "@/lib/hooks/useRecruiterDashboardData";
import { cardClass, panelHeadingClass, panelSubtextClass, scrollAreaClass } from "@/lib/ui/styles";

const FLOW_STEPS = [
  "Lesson metadata (lib/curriculum — 4 tracks, 13 lessons)",
  "Learner profile + knowledge graph (quizzes, notes, sessions, cross-lesson weak concepts)",
  "Mentor turn plan (lib/ai/mentor-engine.ts — mode, strategy, ending per turn)",
  "Prompt builder (lib/ai/prompts/* + lesson-context.ts)",
  "Groq llama-3.1-8b-instant (stream or JSON)",
  "Persist: Summary, Quiz, QuizAttempt, Messages, Notes",
];

const UX_NOTES = [
  "Learn — chat history popover/drawer (no permanent sidebar); sessions in TanStack Query + sessionStorage",
  "Practice — AI quiz with concept checks; score shown in header after submit",
  "Notes — multi-note per lesson, local drafts before save",
  "Sidebar — collapsible learning tracks; mobile hamburger drawer",
  "RAG — per-lesson PDF upload, Cohere embed, grounded chat",
];

export default function RecruiterDashboard({ lessonId }: { lessonId: string }) {
  const { data: profileData } = useLearnerProfileQuery(lessonId);
  const { cacheSnapshot } = useRecruiterDashboardData(lessonId);

  return (
    <div className={`${scrollAreaClass} gap-4 pb-2`}>
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
          Learn → Practice → Mock Interview → Review
        </p>
        <p className="text-[12px] text-muted">
          Learn uses the Mentor Personality Engine (not a generic chatbot) — modes,
          strategies, and turn endings rotate per message. Practice, interview, and
          review each use a different prompt personality with the same learner profile.
        </p>
      </div>

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          API flow (per AI request)
        </p>
        <ol className="list-decimal space-y-1 pl-4 text-[12px] text-ink">
          {FLOW_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          Key AI modules
        </p>
        <ul className="space-y-1 text-[12px] font-mono text-ink">
          <li>mentor-engine.ts — turn plan (mode, strategy, ending, transitions)</li>
          <li>mentor-context.ts — off-topic detection, confusion signals</li>
          <li>learn.ts — mentor base prompt</li>
          <li>practice.ts — examiner + checksConcept</li>
          <li>review.ts — mentor + personalized review JSON</li>
          <li>mock-interview.ts — senior interviewer</li>
          <li>lesson-context.ts — metadata + quiz performance formatter</li>
        </ul>
      </div>

      <div className={`${cardClass} flex flex-col gap-2`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          Frontend UX (high level)
        </p>
        <ul className="list-disc space-y-1 pl-4 text-[12px] text-ink">
          {UX_NOTES.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
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
          Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Geist · TanStack Query · Prisma · PostgreSQL (Neon) · Groq · Cohere embeddings · Sonner · Streaming SSE
        </p>
      </div>
    </div>
  );
}
