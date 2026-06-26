# AI LMS Tutor

An **AI-first learning platform** for software engineers. Lessons are structured **metadata** (objectives, concepts, interview focus, production topics) — not long static textbooks. Groq and Cohere generate explanations, quizzes, personalized reviews, and mock interviews from that metadata at runtime.

**Live demo:** [ai-lms-tutor.vercel.app](https://ai-lms-tutor-sigma.vercel.app/)

---

## Learning flow

Each lesson follows a four-step workflow:

```
Learn → Practice → Mock Interview → Review
```

| Tab | What it does |
|-----|--------------|
| **Learn** | AI mentor with adaptive teaching — Socratic questions, production stories, smart off-topic bridges |
| **Practice** | AI-generated quiz with concept checks, explanations, and interview takeaways |
| **Mock Interview** | Streaming senior-interviewer session tailored to the lesson |
| **Review** | Personalized mentor review: strengths, gaps, revision plan, production examples |

Utility tabs: **Notes**, **RAG Chat** (upload PDFs for lesson-scoped retrieval), **Live Chat** (voice demo).

---

## UI overview

| Area | Behavior |
|------|----------|
| **Lesson sidebar** | Collapsible **Learning Tracks** on desktop (AI Engineering, Frontend, Backend, System Design) |
| **Mobile nav** | Hamburger opens a slide-in drawer with the full track/lesson list |
| **Learn chat** | No permanent history sidebar — pencil for new chat; history popover/drawer when 2+ sessions exist |
| **Notes** | Multi-note per lesson, local drafts, mobile editor toolbar (Save / Cancel / Edit / Delete) |
| **Practice** | Mobile-friendly quiz cards with wrapping code options; Generate / Regenerate in the top-right |
| **Typography** | Geist Sans + Geist Mono |
| **Progress color** | `#00AA45` for quiz success, review strengths, and active lesson indicators |

---

## Curriculum

Lessons live in `lib/curriculum/` and are re-exported from `app/data/lessons.ts`.

**13 lessons** across **4 tracks:**

| Track | Topics |
|-------|--------|
| AI Engineering | Prompt engineering, RAG, embeddings, AI agents |
| Frontend | React fundamentals, Next.js App Router, TanStack Query, React performance |
| Backend | REST API design, authentication, PostgreSQL |
| System Design | System design fundamentals, observability |

Each lesson includes:

- `objectives`, `concepts`, `productionTopics`, `interviewFocus`
- `prerequisites`, `tags`, `difficulty`, `estimatedMinutes`, `trackId`

`lib/curriculum/knowledge-graph.ts` links lessons via concept chains and prerequisite edges. The learner profile uses this graph for cross-lesson weak/strong concept detection.

### Adding or editing lessons

Edit `lib/curriculum/lessons.ts` and add a matching node in `knowledge-graph.ts`. No API or UI changes required — the server resolves `lessonId` and injects metadata into prompts automatically.

---

## AI prompts

Mode-specific system prompts in `lib/ai/prompts/`:

| File | Role |
|------|------|
| `learn.ts` | AI mentor base prompt (Learn tab) |
| `practice.ts` | Examiner (quiz generation) |
| `review.ts` | Mentor (personalized review JSON) |
| `mock-interview.ts` | Senior interviewer |
| `lesson-context.ts` | Formats lesson metadata + quiz performance for prompts |

Clients send `lessonId` + `userId`; the server loads lesson metadata and learner profile — not raw lesson content blobs.

---

## Mentor Personality Engine

The Learn tab is not a generic chatbot. Each turn, `lib/ai/mentor-engine.ts` builds a **turn plan** injected into the system prompt before calling Groq:

| Dimension | What it does |
|-----------|--------------|
| **4 modes** | Coach · Senior Engineer · Interviewer · Debugger — rotated by learner state |
| **10 strategies** | Explain · Analogy · Scenario · MiniQuiz · Challenge · ProductionStory · DebugExercise · InterviewMode · ReverseQuestion · ThinkFirst |
| **5 endings** | teach-only · story-end · socratic-question · challenge-wait · mini-quiz — not every reply ends with a question |
| **55+ transitions** | Bridge openers deduped per session — avoids repetitive "Now imagine…" |
| **Smart bridges** | Off-topic trivia gets a brief answer + 2–3 hop conceptual chain back to the lesson (e.g. Tom Cruise → Netflix → Server Components) |
| **Session memory** | Callbacks to earlier topics in the thread ("Earlier we talked about Netflix…") |
| **Humor gate** | At most one light joke ~every 17 turns — otherwise no emojis |

`lib/ai/mentor-context.ts` detects off-topic streaks and confusion signals. `lib/ai/chat.ts` passes prior user + assistant messages into the engine on every request.

---

## Learner memory

`lib/db/learner-profile.ts` aggregates activity across the app:

- Quiz attempts and scores
- Chat sessions and recent topics
- Notes
- Cross-lesson performance via the knowledge graph

Produces `strongConcepts`, `weakConcepts`, quiz scores, note topics, chat topics, and interview status. Injected into all AI routes via `formatLearnerProfile()`.

- **`buildLearnerProfileSafe()`** — returns an empty profile if Neon/DB is unreachable so AI features still work without history
- **`GET /api/learner-profile`** — exposes the profile for debugging and recruiter demo

---

## Architecture

```
Browser (Next.js App Router)
  │
  ├── Learn / Practice / Review / Interview tabs
  │     └── POST /api/chat | /api/quiz | /api/summary | /api/interview
  │           └── lessonId → curriculum + learner profile + mentor turn plan
  │
  ├── Notes, Sessions
  │     └── /api/notes, /api/sessions, /api/messages
  │
  ├── RAG (per lesson)
  │     └── upload-pdf → embed (Cohere) → rag-chat (retrieve + Groq)
  │
  └── Live Chat (voice demo, no DB)
        └── transcribe (Groq Whisper) → demo-chat

PostgreSQL (Neon) via Prisma
  User, Session, Message, Note, Quiz, QuizAttempt, Summary, Document, Chunk
```

---

## API routes

| Route | Purpose |
|-------|---------|
| `POST /api/chat` | Learn-mode streaming chat |
| `POST /api/quiz` | Generate practice questions |
| `POST /api/quiz/submit` | Record attempt + score |
| `POST /api/summary` | Personalized review JSON |
| `POST /api/interview` | Mock interview streaming |
| `GET /api/learner-profile` | Aggregated learner profile |
| `GET/POST /api/sessions` | Chat session CRUD |
| `GET/DELETE /api/sessions/[sessionId]` | Single session |
| `GET/POST/PATCH/DELETE /api/notes` | Multi-note per lesson |
| `POST /api/upload-pdf` | PDF upload for RAG |
| `POST /api/embed` | Chunk + embed documents |
| `POST /api/rag-chat` | RAG-grounded chat |
| `POST /api/transcribe` | Voice → text (Live Chat) |
| `POST /api/demo-chat` | Voice demo chat (no DB) |

All AI routes accept `lessonId` (required) and optionally `userId` for personalization.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Typography | Geist Sans + Geist Mono |
| AI (chat / quiz / review / interview) | Groq — `llama-3.1-8b-instant` |
| Embeddings | Cohere — `embed-english-v3.0` |
| Voice | Groq Whisper (`whisper-large-v3-turbo`) |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Client state | TanStack Query |
| Toasts | Sonner |

---

## Setup

### Prerequisites

- Node.js 18+
- Accounts: [Groq](https://console.groq.com), [Cohere](https://dashboard.cohere.com), [Neon](https://neon.tech)

### 1. Clone and install

```bash
git clone https://github.com/itsbhavsagar/ai-lms-tutor.git
cd ai-lms-tutor
npm install
```

### 2. Environment variables

Create `.env.local`:

```env
GROQ_API_KEY=gsk_...
COHERE_API_KEY=...
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

### 3. Database

Ensure your Neon project is **active** (paused databases cause connection failures). Use the **direct** (non-pooler) connection URL for migrations if the pooler times out. Then:

```bash
npx prisma migrate deploy
npx prisma generate
```

`postinstall` and `dev` also run `prisma generate` automatically.

An anonymous `userId` is generated in `localStorage` on first visit and upserted to Postgres on the first API call that needs it.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
app/
  api/                    # Route handlers (chat, quiz, summary, interview, RAG, sessions, notes)
  components/
    chat/                 # ChatComposer, history popover/drawer, message bubbles
    notes/                # NoteCard
    ui/                   # EmptyState, PrimaryButton, Skeleton
    ChatTab.tsx           # Learn tab + session history UX
    QuizTab.tsx           # Practice tab
    SummaryTab.tsx        # Review tab
    InterviewTab.tsx      # Mock interview
    NotesTab.tsx          # Multi-note editor
    RagTab.tsx            # PDF RAG chat
    DemoTab.tsx           # Live voice chat
    LessonTrackSidebar.tsx
    LessonSidebarPanel.tsx
    MobileLessonNav.tsx   # Mobile hamburger drawer
    RecruiterDashboard.tsx
    Tabs.tsx
  data/lessons.ts         # Re-exports from lib/curriculum
  types/                  # Quiz, summary/review, chat types

lib/
  ai/
    prompts/              # Mode-specific system prompts (learn, practice, review, interview)
    mentor-engine.ts      # Turn plan: mode, strategy, ending, transitions, session memory
    mentor-context.ts     # Off-topic detection, confusion signals
  curriculum/             # Lesson metadata, tracks, knowledge graph
  db/                   # Prisma client, learner profile, quiz performance, sessions
  chat/                   # Message formatting, suggestions, session cache
  learning/               # Workflow step definitions, legacy tab migration
  hooks/                  # useAppNavigation, TanStack Query hooks, useRecruiterMode
  notes/                  # Draft helpers, card colors
  ui/                     # Shared style tokens (buttons, cards, plain-field)
  utils/                  # Navigation persistence, validation, rate limiting

prisma/
  schema.prisma           # User, Session, Message, Note, Quiz, Summary, Document, Chunk
```

---

## Navigation

Tab IDs persist in `localStorage`. Legacy IDs are migrated automatically:

| Old | New |
|-----|-----|
| `chat` | `learn` |
| `quiz` | `practice` |
| `summary` | `review` |

See `lib/learning/journey.ts` and `lib/utils/appNavigation.ts`.

---

## Recruiter demo mode

A header toggle enables **Recruiter Demo** mode (`RecruiterDashboard.tsx`). It surfaces architecture notes, prompt locations, Prisma models, live learner profile JSON, and TanStack Query cache — useful for portfolio walkthroughs, not for learners.

---

## Deployment (Vercel)

1. Push to GitHub and import the repo in [Vercel](https://vercel.com).
2. Add `GROQ_API_KEY`, `COHERE_API_KEY`, and `DATABASE_URL` in project settings.
3. Deploy. Run `npx prisma migrate deploy` against production Neon when schema changes.

---

## License

MIT
