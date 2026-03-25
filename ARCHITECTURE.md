# AI LMS System Architecture

## Overview

This is a **production-grade backend architecture** for an AI-powered Learning Management System built with Next.js 16 (App Router), React 19, and Vercel AI SDK.

The system separates concerns into distinct layers:

- **Database Layer** - Data persistence and schema definitions
- **AI Orchestration** - Business logic for chat, RAG, and embeddings
- **Utilities** - Pure functions for PDF parsing, text processing, validation
- **Middleware** - Security and rate limiting
- **API Routes** - HTTP endpoints (should remain thin and focused)

---

## Folder Structure & Rationale

```
/lib
├── /db
│   ├── index.ts       # Database abstraction (IDatabase interface + MockDB)
│   └── schema.ts      # TypeScript types for all domain models
├── /ai
│   ├── chat.ts        # Chat orchestration (main entry point)
│   ├── rag.ts         # RAG pipeline (ingest, retrieve, format)
│   ├── embeddings.ts  # Embedding generation via Cohere
│   └── prompt.ts      # Prompt construction & memory management
├── /utils
│   ├── pdf.ts         # PDF extraction using pdf2json
│   ├── text.ts        # Text chunking, cleaning, token counting
│   ├── vectorStore.ts # Cosine similarity & vector search
│   └── validation.ts  # Input validation with typed errors
└── /middleware
    └── rateLimit.ts   # Rate limiting with configurable windows

/app/api
├── /chat              # Main chat endpoint (streaming)
├── /sessions          # Session CRUD operations
├── /upload-pdf        # Document ingestion
└── ... (other endpoints)
```

### Why This Structure?

| Folder            | Purpose          | Why Separated                                                                        |
| ----------------- | ---------------- | ------------------------------------------------------------------------------------ |
| `/lib/db`         | Data abstraction | Swap implementations (MockDB → MongoDB/PostgreSQL) without touching business logic   |
| `/lib/ai`         | AI orchestration | Reusable functions; coordinate multiple AI operations; testable without HTTP         |
| `/lib/utils`      | Pure functions   | No dependencies on HTTP, DB, or AI SDK; highly testable and reusable                 |
| `/lib/middleware` | Cross-cutting    | Shared concerns (rate limiting, auth) in one place; applied consistently across APIs |
| `/app/api`        | HTTP handlers    | Minimal, focused on HTTP concerns; delegate to `/lib` layers                         |

---

## Architecture Layers

### 1. API Layer (`/app/api`)

**Responsibility**: Handle HTTP requests/responses, apply middleware, delegate to business logic.

**Key Constraint**: Should be **thin** - no business logic here.

**Example** (`/app/api/chat`):

```
Request → Rate Limiting → Input Validation → Call chatWithContext() → Stream Response
```

### 2. AI Orchestration (`/lib/ai/chat.ts`)

**Responsibility**: Coordinate all AI operations for a single feature (chat).

**Key Functions**:

- `chatWithContext()` - Main entry point
  - Load session from DB
  - Select relevant memory messages (stay within token budget)
  - Retrieve RAG context (if enabled)
  - Build system prompt with lesson + RAG context
  - Stream response from Groq
  - Save messages to session on finish
  - Track token usage

**Why Separated**: Allows calling chat logic from multiple sources (API routes, scheduled jobs, webhooks) without duplication.

### 3. RAG Pipeline (`/lib/ai/rag.ts`)

**Responsibility**: Document ingestion and semantic retrieval.

**Key Functions**:

- `ingestDocument()` - Parse → Chunk → Embed → Store
- `retrieveRelevantChunks()` - Query → Embed → Search → Rank → Return
- `formatRetrievedContext()` - Format chunks for prompt injection

**Design**: Standalone functions that can be tested independently.

### 4. Memory & Prompt (`/lib/ai/prompt.ts`)

**Responsibility**: Build prompts with memory management and context injection.

**Key Features**:

- **Memory Selection**: Keeps conversation within token budget
  - Selects last N messages
  - Falls back to most recent if over budget
  - Prevents unbounded context growth

- **Token Counting**: Rough estimation (1 token ≈ 4 chars)
- **Prompt Building**: Injects lesson + RAG context into system prompt

**Why Separated**: Prompt engineering logic isolated from request handling.

### 5. Embeddings & Vector Store

**Embeddings** (`/lib/ai/embeddings.ts`):

- Generates embeddings via Cohere API
- Batch processing for efficiency
- Handles rate limiting automatically

**Vector Store** (`/lib/utils/vectorStore.ts`):

- Cosine similarity calculation
- Top-K retrieval
- No external dependencies (pure math)

### 6. Database Abstraction (`/lib/db`)

**Key Design Pattern**:

```typescript
interface IDatabase {
  // Operations
  getSession(id: string): Promise<ChatSession>
  updateSession(session: ChatSession): Promise<void>
  // ... etc
}

class MockDatabase implements IDatabase { ... }
const db = new MockDatabase();
export default db;
```

**Benefits**:

- **Swappable**: Replace MockDB with MongoDB without changing business logic
- **Testable**: Mock specific operations in unit tests
- **Clear Contract**: Types document all operations

**Current Implementation**: In-memory MockDB (suitable for development)

**Production Migration**:

```typescript
// Create /lib/db/mongoDb.ts
class MongoDatabase implements IDatabase { ... }

// Update /lib/db/index.ts
const db = process.env.USE_MONGO
  ? new MongoDatabase()
  : new MockDatabase();
```

### 7. Utilities

**PDF Parsing** (`/lib/utils/pdf.ts`):

- Extracts text using pdf2json
- Error handling for corrupted PDFs

**Text Processing** (`/lib/utils/text.ts`):

- `chunkText()` - Simple fixed-size chunking with overlap
- `chunkTextSemantic()` - Paragraph-aware chunking (better for structured docs)
- `estimateTokenCount()` - Rough token estimation
- `truncateToTokenBudget()` - Fit text within token limits

**Validation** (`/lib/utils/validation.ts`):

- Type-safe validation with descriptive errors
- Prevents bad requests early

### 8. Rate Limiting (`/lib/middleware/rateLimit.ts`)

**Design**:

```typescript
// Create limiter for an endpoint
const limiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests/minute
});

// Use in route
const result = limiter(req);
if (!result.allowed) {
  return createRateLimitResponse(result.remaining, result.resetTime);
}
```

**Pre-configured Limits**:

- **API** (standard): 60/minute
- **Chat** (expensive): 30/minute
- **Upload** (resource-heavy): 10/10 minutes
- **Strict** (auth): 5/minute

---

## Data Flow

### Chat with Context

```
User Message
    ↓
[API Route] /api/chat
    ↓
Rate Limit Check
    ↓
Input Validation
    ↓
chatWithContext(sessionId, message, lesson)
    ↓
    ├─→ Load Session from DB
    ├─→ Select Memory Messages (token budget)
    ├─→ retrieveRelevantChunks(message)
    │   ├─→ Get all documents for lesson
    │   ├─→ Generate embedding for query
    │   ├─→ Find top K similar chunks (cosine similarity)
    │   └─→ Return [{ text, score, source }, ...]
    ├─→ Format RAG Context for injection
    ├─→ Build System Prompt (lesson + RAG + custom)
    ├─→ Build Messages (system + history + current)
    ├─→ Stream from Groq via AI SDK
    ├─→ Collect full response
    ├─→ Save Messages to Session
    └─→ Update Token Count
    ↓
Stream SSE Response to User
```

### Document Ingestion

```
PDF Upload
    ↓
[API Route] /api/upload-pdf
    ↓
Rate Limit + Validation
    ↓
ingestDocument(userId, lessonId, fileName, text)
    ↓
    ├─→ Chunk text (semantic boundaries)
    ├─→ Generate embeddings for chunks (batched)
    ├─→ Create DocumentChunk objects with embeddings
    └─→ Save to DB
    ↓
Return { documentId, chunksCreated }
```

---

## Key Design Decisions

### 1. **Memory Management**

**Problem**: Context windows are limited; old messages should be forgotten.

**Solution**:

- Keep last N messages (configurable)
- Fall back to most recent if over token budget
- Track token count per session
- Hard limit of 100 messages per session (trim oldest)

**Code** (`/lib/ai/prompt.ts`):

```typescript
const contextMessages = selectMemoryMessages(session.messages, {
  maxMessages: 10,
  maxTokens: 4000,
});
```

### 2. **RAG Injection**

**Problem**: How to inject context without overwhelming the model?

**Solution**:

- Retrieve top 5 chunks (configurable)
- Only inject if similarity > 0.3 (tunable)
- Format with source attribution and relevance scores
- Inject into system prompt (not as separate messages)

### 3. **Streaming for UX**

**Problem**: Chat responses can take several seconds; users want immediate feedback.

**Solution**:

- Use Vercel AI SDK `streamText` for real-time output
- Client sees response appearing instantly
- Reduce perceived latency

### 4. **Rate Limiting at Middleware Level**

**Problem**: Abuse protection; prevent runaway costs.

**Solution**:

- Apply before business logic
- Different limits per endpoint (chat is more expensive)
- Return 429 with retry info
- In-memory store with auto-cleanup

### 5. **Separation of Concerns**

**Problem**: Monolithic API routes are hard to test and maintain.

**Solution**:

- Pure utilities have zero dependencies
- Orchestration layer coordinates subsystems
- DB layer abstracts persistence
- API routes are ~30 lines (just HTTP plumbing)

---

## Production Considerations

### Database Migration (MockDB → MongoDB)

Currently using in-memory MockDB. To migrate:

1. **Create MongoDB implementation**:

```typescript
// /lib/db/mongoDb.ts
class MongoDatabase implements IDatabase {
  // Implement interface using MongoDB driver
}
```

2. **Update exports**:

```typescript
// /lib/db/index.ts
const db =
  process.env.NODE_ENV === "production"
    ? new MongoDatabase()
    : new MockDatabase();
export default db;
```

3. **Define schemas** (optional):

```typescript
// /lib/db/mongoDb.ts
const sessionSchema = new Schema({
  userId: String,
  messages: [{ role: String, content: String, timestamp: Date }],
  // ...
});
```

### Environment Variables Required

```env
GROQ_API_KEY=your_groq_api_key
COHERE_API_KEY=your_cohere_api_key

# Optional for production DB
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
```

### Token Budget Optimization

Current estimates:

- Lesson content: ~2000 tokens
- RAG context: ~1000 tokens
- Memory: ~2000 tokens
- Total: ~5000 tokens (leaves room for response)

Tune in `/lib/ai/prompt.ts`:

```typescript
const DEFAULT_MEMORY: Required<MemoryConfig> = {
  maxMessages: 10, // ← Reduce for smaller budget
  maxTokens: 4000, // ← Adjust based on model limit
};
```

### Scaling Considerations

| Component       | Bottleneck           | Solution                             |
| --------------- | -------------------- | ------------------------------------ |
| Embeddings API  | Rate limits (Cohere) | Queue with backoff, cache embeddings |
| Vector search   | Linear O(n)          | Use vector DB (Pinecone, Weaviate)   |
| Session storage | In-memory limit      | Move to MongoDB with auto-cleanup    |
| API concurrency | Memory               | Use serverless functions (Vercel)    |

---

## Testing

### Unit Tests (No Dependencies)

```typescript
import { cosineSimilarity } from "@/lib/utils/vectorStore";

test("cosine similarity", () => {
  const a = [1, 0, 0];
  const b = [1, 0, 0];
  expect(cosineSimilarity(a, b)).toBe(1); // Identical
});
```

### Integration Tests (With Mocks)

```typescript
import db from "@/lib/utils/db";

test("chat session persistence", async () => {
  const session = await db.createSession("user1", "lesson1");
  session.messages.push({
    role: "user",
    content: "Hello",
    timestamp: new Date(),
  });
  await db.updateSession(session);

  const loaded = await db.getSession(session.id);
  expect(loaded?.messages).toHaveLength(1);
});
```

---

## Assumptions

1. **Groq API** is available and fast (it's remarkably responsive)
2. **Cohere Embeddings** are sufficient (embed-english-v3.0 is excellent)
3. **Token estimates** are conservative (4 chars per token) for safety
4. **MockDB is acceptable** for MVP; migrate to MongoDB when needed
5. **PDFs are mostly text-based** (scanned PDFs need OCR preprocessing)
6. **Users are authenticated separately** (sessionId ties to userId elsewhere)
7. **Rate limits are per-IP** (simple header-based tracking)

---

## Next Steps

1. **Test the implementation** - Send test requests to `/api/chat` and `/api/upload-pdf`
2. **Connect to frontend** - Update client code to use new session-based API
3. **Monitor performance** - Track token usage, latency, embedding costs
4. **Migrate to MongoDB** - When in-memory storage becomes a bottleneck
5. **Add vector DB** - When similarity search becomes slow (1000+ documents)
6. **Implement caching** - Cache embeddings for identical queries

---

## Summary

This architecture provides:

✅ **Clear separation of concerns** - Easy to understand, modify, test
✅ **Scalability** - Swappable components (DB, embeddings, streaming)
✅ **Production-ready** - Rate limiting, validation, error handling
✅ **Type safety** - Full TypeScript with strict mode
✅ **Memory management** - Prevents unbounded context growth
✅ **Security** - API keys server-only, input validation, rate limits
✅ **Real RAG pipeline** - Actual document chunking, embedding, retrieval
✅ **Extensibility** - Easy to add new AI features (quiz generation, summarization, etc.)

The system is designed to **handle real users**, not just demos. Every component has been thought through for production use.
