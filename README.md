# AI LMS Tutor

AI LMS Tutor is a Next.js learning app that combines lesson-based tutoring, AI summaries, quiz generation, note-taking, voice transcription, and retrieval-augmented chat in one interface.

The project ships with a small set of built-in lessons and uses Groq for chat, quiz, summary, and transcription workflows, Cohere for embeddings, and Prisma with PostgreSQL for persistence.

## Features

- Lesson-based study UI with a sidebar and tabbed workspace
- **AI Chat** with suggested starter questions, streaming responses, chat history sidebar, copy/regenerate actions, and voice input
- **AI-generated quizzes** with attempt tracking and score display after refresh
- **AI-generated lesson summaries** (overview, key points, remember-this)
- **Multi-note editor** per lesson — create, edit, and delete notes with auto-derived titles
- **RAG chat** over pasted content or uploaded PDFs
- **Live Chat** demo tab with lightweight streaming
- TanStack Query caching so tab switches do not refetch unchanged lesson data
- Toast notifications (top-right) for errors, success, and confirmations
- Navigation persistence — active tab and selected lesson survive page refresh
- Simple in-memory rate limiting for selected API routes

## Tech Stack

- Next.js 16 with App Router
- React 19
- TypeScript
- TanStack Query for server-state caching
- Tailwind CSS v4
- Sonner for toast notifications
- Prisma ORM
- PostgreSQL
- Groq SDK
- Cohere SDK
- `pdf2json` for PDF text extraction

## How It Works

### Lessons (frontend-only)

Lesson content is **not** loaded from the backend. All lessons are defined in [`app/data/lessons.ts`](app/data/lessons.ts):

```ts
type Lesson = {
  id: string;      // e.g. "photosynthesis"
  title: string;   // e.g. "🌱 Photosynthesis"
  content: string; // lesson text sent to the AI
};
```

There is no `Lesson` database model and no `/api/lessons` route. When a tab needs lesson context, the frontend sends `lessonId`, `lessonTitle`, and `lessonContent` in the request body. The backend stores only the `lessonId` string on user-generated records (sessions, notes, quizzes, etc.).

Built-in lessons:

| ID | Title |
| --- | --- |
| `photosynthesis` | 🌱 Photosynthesis |
| `newton-laws` | ⚡ Newton's Laws |
| `water-cycle` | 💧 Water Cycle |
| `cell-biology` | 🔬 Cell Biology |

### User identity & persistence

When a user opens the app, a browser-local `userId` (UUID) is created and reused through `localStorage`. That `userId` associates sessions, notes, summaries, quizzes, uploaded documents, and message history in PostgreSQL.

Additional client-side persistence:

| Key | Purpose |
| --- | --- |
| `userId` | Anonymous user identifier |
| `lms-active-tab` | Last selected tab |
| `lms-selected-lesson-id` | Last selected lesson |
| Per-lesson chat session | Active chat session ID per lesson |

See [`lib/utils/appNavigation.ts`](lib/utils/appNavigation.ts) and [`lib/chat/sessionStorage.ts`](lib/chat/sessionStorage.ts).

### Main workspace

The study experience lives in [`app/page.tsx`](app/page.tsx). Users switch between these tabs:

| Tab | Description |
| --- | --- |
| **Chat** | Lesson Q&A with session history, suggested questions, streaming, and voice input |
| **Quiz** | Generates 4 multiple-choice questions from the selected lesson |
| **Summary** | Creates a structured lesson summary |
| **Notes** | Multi-note editor with card grid, draft mode, and CRUD |
| **RAG Chat** | Indexes pasted text or PDFs and answers from retrieved chunks |
| **Live Chat** | Standalone demo streaming chat |

Tabs are mounted conditionally (only the active tab renders). Server data is not lost on tab switch because it lives in a TanStack Query cache above the tab tree, keyed by `userId` and `lessonId`.

## Chat

[`app/components/ChatTab.tsx`](app/components/ChatTab.tsx) and [`app/components/chat/`](app/components/chat/) implement the chat experience:

- **Empty state** with suggested questions ([`lib/chat/suggestions.ts`](lib/chat/suggestions.ts))
- **Lazy session creation** — a DB session is created only when the first message is sent
- **Chat history sidebar** — lists past conversations for the current lesson (shown once a chat has messages)
- **Streaming** with thinking indicator and cursor
- **Message actions** — copy and regenerate last assistant reply
- **Auto-growing composer** with mic and send icons inside the input (ChatGPT-style)
- **Voice input** via hold-to-record and Groq Whisper transcription

Chat subcomponents: `ChatSidebar`, `ChatEmptyState`, `ChatMessageBubble`, `ChatThinkingIndicator`.

## Notes

[`app/components/NotesTab.tsx`](app/components/NotesTab.tsx) provides a multi-note interface per lesson:

- Grid of note cards with color accents
- Draft notes saved locally until the user clicks Save
- Auto-derived titles from content ([`lib/notes/title.ts`](lib/notes/title.ts))
- Edit and delete with toast confirmation
- Full CRUD via `/api/notes` (`GET`, `POST`, `PATCH`, `DELETE`)

## State Management & Data Fetching

The app separates **server state** from **UI state**:

| Layer | Responsibility | Examples |
| --- | --- | --- |
| TanStack Query | Fetched and mutated server data | quiz, notes, summary, chat sessions/messages, RAG index status |
| Component `useState` | Ephemeral UI state | quiz selections, note drafts, streaming buffers, mic recording |
| `localStorage` | Browser-persistent identifiers | `userId`, active tab, selected lesson, chat session per lesson |

### Query cache

[`app/providers.tsx`](app/providers.tsx) wraps the app in a `QueryClientProvider`. Query keys are defined in [`lib/query/keys.ts`](lib/query/keys.ts) and scoped by `userId` + `lessonId` (or `sessionId` for chat messages).

Default cache behavior ([`lib/query/config.ts`](lib/query/config.ts)):

- `staleTime`: 5 minutes — cached data is considered fresh; tab remounts do not trigger new requests
- `gcTime`: 30 minutes — unused cache entries are garbage-collected after this period
- Mutations invalidate or update the cache (e.g. generating a quiz refetches quiz data; saving notes writes directly to cache)

Feature hooks live under [`lib/hooks/queries/`](lib/hooks/queries/) (`useQuiz`, `useNotes`, `useSummary`, `useMessages`, `useSessions`, `useRag`, etc.).

### API client layer

All frontend HTTP calls go through [`lib/api/client.ts`](lib/api/client.ts) (`apiGet`, `apiPost`, `apiStreamPost`, etc.) and domain modules in [`lib/api/`](lib/api/). Errors are normalized to user-friendly messages via [`lib/utils/errorMessage.ts`](lib/utils/errorMessage.ts) and surfaced as toasts through the global query/mutation error handlers in [`lib/query/query-client.ts`](lib/query/query-client.ts).

## Project Structure

```text
ai-lms-tutor/
├── app/
│   ├── api/                 # Route handlers (chat, quiz, summary, notes, RAG, sessions, etc.)
│   ├── components/
│   │   ├── chat/            # Chat sidebar, bubbles, empty state, thinking indicator
│   │   ├── notes/           # Note card component
│   │   ├── learning/        # Shared learning UI helpers
│   │   ├── ChatTab.tsx      # Main chat tab
│   │   ├── NotesTab.tsx     # Multi-note editor
│   │   ├── QuizTab.tsx
│   │   ├── SummaryTab.tsx
│   │   ├── RagTab.tsx
│   │   ├── DemoTab.tsx
│   │   ├── Tabs.tsx
│   │   └── AppToaster.tsx
│   ├── data/
│   │   └── lessons.ts       # Built-in lesson content (frontend-only)
│   ├── types/               # Shared frontend types
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx             # Main application shell
│   └── providers.tsx        # QueryClientProvider and global toasts
├── lib/
│   ├── ai/                  # Groq/Cohere helpers
│   ├── api/                 # Typed frontend API client
│   ├── chat/                # Session storage, suggestions, formatting
│   ├── db/                  # Prisma client and session helpers
│   ├── hooks/               # useUserId, useAppNavigation, query hooks
│   ├── notes/               # Title derivation, drafts, card colors
│   ├── middleware/          # Rate limiting
│   ├── query/               # Query keys, cache config, QueryClient factory
│   └── utils/               # Validation, storage, errors, toasts, PDF helpers
├── prisma/
│   ├── migrations/
│   └── schema.prisma
└── public/
```

## Database Models

The Prisma schema in [`prisma/schema.prisma`](prisma/schema.prisma) defines these main entities:

- `User` — logical app user keyed by a generated browser ID
- `Session` — a chat session for a lesson (`lessonId` string, optional title)
- `Message` — chat history for a session
- `Document` — uploaded or pasted RAG source material
- `Chunk` — embedded text chunks tied to a document
- `Note` — saved lesson notes with `title` and `content`
- `Summary` — generated summary snapshots
- `Quiz` — generated quiz payloads (JSON)
- `QuizAttempt` — stored quiz scores

There is **no** `Lesson` table. Lesson content lives in the frontend.

## Environment Variables

Create a `.env` or `.env.local` file:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
GROQ_API_KEY="your_groq_api_key"
COHERE_API_KEY="your_cohere_api_key"
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the database

Make sure PostgreSQL is running and `DATABASE_URL` points to it.

Generate the Prisma client and apply migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

For an existing database in production:

```bash
npx prisma migrate deploy
```

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` — start the Next.js development server
- `npm run build` — generate Prisma client and build the app
- `npm run start` — run the production build
- `npm run lint` — run ESLint

## Core API Routes

Server routes live under [`app/api`](app/api).

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/sessions` | `GET`, `POST` | List or create chat sessions for a lesson |
| `/api/sessions/[sessionId]` | `DELETE` | Delete a chat session and its messages |
| `/api/messages` | `GET` | Paginated session message history |
| `/api/chat` | `POST` | Lesson-aware streaming chat |
| `/api/demo-chat` | `POST` | Lightweight demo streaming chat |
| `/api/summary` | `GET`, `POST` | Load or generate lesson summaries |
| `/api/quiz` | `GET`, `POST` | Load or generate quizzes |
| `/api/quiz/submit` | `POST` | Save quiz attempt results |
| `/api/notes` | `GET`, `POST`, `PATCH`, `DELETE` | List, create, update, or delete notes |
| `/api/embed` | `POST` | Embed pasted text for RAG |
| `/api/upload-pdf` | `POST` | Extract PDF text, chunk it, and store embeddings |
| `/api/rag-chat` | `POST` | Retrieve similar chunks and answer using them |
| `/api/transcribe` | `POST` | Convert recorded audio to text with Groq Whisper |

### What the backend receives vs returns for lessons

**Sent by the frontend (not stored as lesson records):**

- `lessonId`, `lessonTitle`, `lessonContent` — on chat, quiz, and summary requests

**Returned by the backend (scoped to `lessonId`):**

- Chat sessions, messages, notes, summaries, quizzes, RAG documents/chunks

## AI Integrations

### Groq

Used for lesson chat, RAG response generation, quiz generation, summary generation, voice transcription, and demo streaming chat.

Models referenced in the code:

- `llama-3.1-8b-instant`
- `whisper-large-v3-turbo`

### Cohere

Used for document embeddings and query embeddings for semantic retrieval.

Model:

- `embed-english-v3.0`

## RAG Flow

1. A user pastes lesson-related text or uploads a PDF.
2. The content is chunked on the server.
3. Cohere embeddings are generated for each chunk.
4. Existing RAG documents for the same `userId` and `lessonId` are replaced.
5. Chunks are stored in PostgreSQL through Prisma.
6. During RAG chat, the latest question is embedded.
7. Stored chunks are scored with cosine similarity.
8. The top chunks are inserted into the system prompt for Groq.

## Notes About User Identity

This project does not implement full authentication. The frontend creates a UUID in browser storage and treats it as the user identifier. Data ownership is browser-specific unless a real auth layer is added later.

## Known Limitations

- Rate limiting is in-memory — resets on server restart and is not shared across instances.
- RAG similarity search runs in application code after loading chunks from the database.
- RAG index status is tracked in the client query cache (no GET endpoint); a full page reload resets the “indexed” UI until content is re-indexed.
- In-progress quiz selections reset when switching tabs (attempt history is still cached).
- Lesson content is hardcoded in the frontend — no CMS or admin lesson editor.
- User identity is local-browser based, not authenticated.
- PDF page count shown in the UI is estimated from chunk count, not true PDF pagination.

## Useful Files

| File | Purpose |
| --- | --- |
| [`app/page.tsx`](app/page.tsx) | Main UI shell, lesson sidebar, tab routing |
| [`app/data/lessons.ts`](app/data/lessons.ts) | Built-in lesson definitions |
| [`app/components/ChatTab.tsx`](app/components/ChatTab.tsx) | Chat tab with sessions, streaming, voice |
| [`app/components/NotesTab.tsx`](app/components/NotesTab.tsx) | Multi-note editor |
| [`lib/hooks/useAppNavigation.ts`](lib/hooks/useAppNavigation.ts) | Tab and lesson persistence |
| [`lib/hooks/queries/`](lib/hooks/queries/) | TanStack Query hooks per feature |
| [`lib/api/client.ts`](lib/api/client.ts) | Shared fetch helpers and error parsing |
| [`lib/ai/chat.ts`](lib/ai/chat.ts) | Streaming chat and session persistence |
| [`app/api/upload-pdf/route.ts`](app/api/upload-pdf/route.ts) | PDF ingestion pipeline |
| [`app/api/rag-chat/route.ts`](app/api/rag-chat/route.ts) | Chunk retrieval and grounded answers |
| [`prisma/schema.prisma`](prisma/schema.prisma) | Data model |

## Future Improvements

- Add real authentication and user accounts
- Move vector search to a dedicated vector database or PostgreSQL extension
- Add a backend `Lesson` model and admin interface for lesson management
- Add tests for API routes and core utility functions
- Improve observability and structured error reporting
- Add deployment instructions for Vercel or Docker
