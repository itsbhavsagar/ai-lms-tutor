# AI LMS Tutor

AI LMS Tutor is a Next.js learning app that combines lesson-based tutoring, AI summaries, quiz generation, note-taking, voice transcription, and retrieval-augmented chat in one interface.

The project ships with a small set of built-in lessons and uses Groq for chat, quiz, summary, and transcription workflows, Cohere for embeddings, and Prisma with PostgreSQL for persistence.

## Features

- Lesson-based study UI with a sidebar and tabbed workspace
- AI chat for asking lesson questions with saved session history
- AI-generated quizzes with attempt tracking
- AI-generated lesson summaries
- Per-lesson personal notes saved to the database
- RAG chat over pasted content or uploaded PDFs
- Voice input transcription for chat prompts
- Streaming demo chat powered by Groq
- TanStack Query caching so tab switches do not refetch unchanged lesson data
- Toast notifications for API errors with user-friendly messages
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

The app starts with a set of predefined lessons in [`app/data/lessons.ts`](app/data/lessons.ts). When a user opens the app, a browser-local `userId` is created and reused through `localStorage`. That `userId` is then used to associate sessions, notes, summaries, quizzes, uploaded documents, and message history in PostgreSQL.

The main study experience lives in [`app/page.tsx`](app/page.tsx), where users can switch between these tabs:

- `Chat`: lesson Q&A with persisted session messages
- `Quiz`: generates multiple-choice questions from the selected lesson
- `Summary`: creates a structured lesson summary
- `Notes`: stores user notes per lesson
- `RAG Chat`: indexes pasted text or PDFs and answers from retrieved chunks
- `Live Chat`: lightweight demo streaming chat

Tabs are mounted conditionally (only the active tab renders). Server data is not lost on tab switch because it lives in a TanStack Query cache above the tab tree, keyed by `userId` and `lessonId`. Switching back to a tab within the stale window serves cached data instantly instead of refetching.

## State Management & Data Fetching

The app separates **server state** from **UI state**:

| Layer | Responsibility | Examples |
| --- | --- | --- |
| TanStack Query | Fetched and mutated server data | quiz, notes, summary, chat history, RAG index status |
| Component `useState` | Ephemeral UI state | quiz selections, edit mode, streaming chat buffers, mic recording |
| `localStorage` | Browser-persistent identifiers | `userId`, per-lesson chat `sessionId` |

### Query cache

[`app/providers.tsx`](app/providers.tsx) wraps the app in a `QueryClientProvider`. Query keys are defined in [`lib/query/keys.ts`](lib/query/keys.ts) and scoped by `userId` + `lessonId` (or `sessionId` for chat messages).

Default cache behavior ([`lib/query/config.ts`](lib/query/config.ts)):

- `staleTime`: 5 minutes — cached data is considered fresh; tab remounts do not trigger new requests
- `gcTime`: 30 minutes — unused cache entries are garbage-collected after this period
- Mutations invalidate or update the cache (e.g. generating a quiz refetches quiz data; saving notes writes directly to cache)

Feature hooks live under [`lib/hooks/queries/`](lib/hooks/queries/) (`useQuiz`, `useNotes`, `useSummary`, `useMessages`, `useRag`, etc.).

### API client layer

All frontend HTTP calls go through [`lib/api/client.ts`](lib/api/client.ts) (`apiGet`, `apiPost`, `apiStreamPost`, etc.) and domain modules in [`lib/api/`](lib/api/). Errors are normalized to user-friendly messages via [`lib/utils/errorMessage.ts`](lib/utils/errorMessage.ts) and surfaced as toasts through the global query/mutation error handlers in [`lib/query/query-client.ts`](lib/query/query-client.ts).

### Why TanStack Query instead of keeping all tabs mounted?

Keeping every tab in the DOM (`display: none`) would preserve component state but wastes memory and keeps inactive listeners alive. Caching server state in TanStack Query gives the same benefit for fetched data — no duplicate requests on tab switch — while only rendering the active tab.

## Project Structure

```text
ai-lms-tutor/
├── app/
│   ├── api/                 # Route handlers for chat, quiz, summary, notes, RAG, upload, etc.
│   ├── components/          # UI tabs, navigation, and shared components
│   ├── data/                # Built-in lesson content
│   ├── types/               # Shared frontend types
│   ├── globals.css          # Global styling
│   ├── layout.tsx           # Root layout and metadata
│   ├── page.tsx             # Main application screen
│   └── providers.tsx        # QueryClientProvider and global toasts
├── lib/
│   ├── ai/                  # Groq/Cohere helpers
│   ├── api/                 # Typed frontend API client (fetch wrappers per domain)
│   ├── db/                  # Prisma client and session helpers
│   ├── hooks/               # React hooks (useUserId, TanStack Query feature hooks)
│   ├── middleware/          # Rate limiting
│   ├── query/               # Query keys, cache config, and QueryClient factory
│   └── utils/               # Validation, storage, errors, toasts, and PDF helpers
├── prisma/
│   ├── migrations/          # Prisma migrations
│   └── schema.prisma        # Database schema
├── public/                  # Static assets
├── package.json
└── README.md
```

## Database Models

The Prisma schema in [`prisma/schema.prisma`](prisma/schema.prisma) defines these main entities:

- `User`: logical app user keyed by a generated browser ID
- `Session`: a chat session for a lesson
- `Message`: chat history for a session
- `Document`: uploaded or pasted RAG source material
- `Chunk`: embedded text chunks tied to a document
- `Note`: saved lesson notes
- `Summary`: generated summary snapshots
- `Quiz`: generated quiz payloads
- `QuizAttempt`: stored quiz scores

## Environment Variables

Create a `.env` or `.env.local` file with the following values:

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

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - start the Next.js development server
- `npm run build` - generate Prisma client and build the app
- `npm run start` - run the production build
- `npm run lint` - run ESLint

## Core API Routes

The server routes are implemented under [`app/api`](app/api).

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/sessions` | `GET`, `POST`, `DELETE` | Create, list, and remove chat sessions |
| `/api/messages` | `GET` | Paginated session message history |
| `/api/chat` | `POST` | Lesson-aware streaming chat |
| `/api/demo-chat` | `POST` | Lightweight demo streaming chat |
| `/api/summary` | `GET`, `POST` | Load or generate lesson summaries |
| `/api/quiz` | `GET`, `POST` | Load or generate quizzes |
| `/api/quiz/submit` | `POST` | Save quiz attempt results |
| `/api/notes` | `GET`, `POST` | Load or save notes |
| `/api/embed` | `POST` | Embed pasted text for RAG |
| `/api/upload-pdf` | `POST` | Extract PDF text, chunk it, and store embeddings |
| `/api/rag-chat` | `POST` | Retrieve similar chunks and answer using them |
| `/api/transcribe` | `POST` | Convert recorded audio to text with Groq Whisper |

## AI Integrations

### Groq

Groq is used for:

- lesson chat
- RAG response generation
- quiz generation
- summary generation
- voice transcription
- demo streaming chat

Current models referenced in the code include:

- `llama-3.1-8b-instant`
- `whisper-large-v3-turbo`

### Cohere

Cohere is used for:

- document embeddings
- query embeddings for semantic retrieval

Current embedding model referenced in the code:

- `embed-english-v3.0`

## RAG Flow

The retrieval pipeline works like this:

1. A user pastes lesson-related text or uploads a PDF.
2. The content is chunked on the server.
3. Cohere embeddings are generated for each chunk.
4. Existing RAG documents for the same `userId` and `lessonId` are replaced.
5. Chunks are stored in PostgreSQL through Prisma.
6. During RAG chat, the latest question is embedded.
7. Stored chunks are scored with cosine similarity.
8. The top chunks are inserted into the system prompt for Groq.

## Notes About User Identity

This project does not currently implement a full authentication system. Instead, the frontend creates a UUID in browser storage and treats it as the user identifier. That makes local development simple, but it also means data ownership is browser-specific unless a real auth layer is added later.

## Known Limitations

- Rate limiting is in-memory, so it resets on server restart and is not shared across instances.
- RAG similarity search is computed in application code after loading chunks from the database.
- RAG index status is tracked in the client query cache (there is no GET endpoint); a full page reload resets the “indexed” UI until content is re-indexed.
- In-progress quiz selections reset when switching tabs (attempt history is still cached).
- The app uses seeded lesson content rather than a full CMS or LMS backend.
- User identity is local-browser based, not authenticated.
- PDF page count shown in the UI is estimated from chunk count, not true PDF pagination.

## Useful Files

- [`app/page.tsx`](app/page.tsx): main UI shell and tab routing
- [`app/providers.tsx`](app/providers.tsx): TanStack Query provider and toast setup
- [`lib/query/keys.ts`](lib/query/keys.ts): cache keys by user, lesson, and session
- [`lib/hooks/queries/`](lib/hooks/queries/): feature query and mutation hooks
- [`lib/api/client.ts`](lib/api/client.ts): shared fetch helpers and error parsing
- [`app/components/ChatTab.tsx`](app/components/ChatTab.tsx): lesson chat with voice input
- [`app/components/RagTab.tsx`](app/components/RagTab.tsx): indexing and RAG chat UI
- [`lib/ai/chat.ts`](lib/ai/chat.ts): streaming chat and session persistence
- [`app/api/upload-pdf/route.ts`](app/api/upload-pdf/route.ts): PDF ingestion pipeline
- [`app/api/rag-chat/route.ts`](app/api/rag-chat/route.ts): chunk retrieval and grounded answers
- [`prisma/schema.prisma`](prisma/schema.prisma): data model

## Future Improvements

- Add real authentication and user accounts
- Move vector search to a dedicated vector database or PostgreSQL extension
- Add tests for API routes and core utility functions
- Support lesson creation from an admin interface
- Improve observability and structured error reporting
- Add deployment instructions for Vercel or Docker
