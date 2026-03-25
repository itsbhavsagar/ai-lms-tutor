# Quick Reference Card

## TL;DR - Folder Purpose

| Folder             | What It Does             | Key Files                                                                                       |
| ------------------ | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `/lib/db/`         | Data storage abstraction | `index.ts` (interface + MockDB), `schema.ts` (types)                                            |
| `/lib/ai/`         | Main AI logic            | `chat.ts` (orchestration), `rag.ts` (retrieval), `embeddings.ts` (Cohere), `prompt.ts` (memory) |
| `/lib/utils/`      | Reusable utilities       | `pdf.ts`, `text.ts`, `vectorStore.ts`, `validation.ts`                                          |
| `/lib/middleware/` | Security/validation      | `rateLimit.ts` (rate limiting)                                                                  |
| `/app/api/`        | HTTP endpoints           | `chat/`, `sessions/`, `upload-pdf/`                                                             |

---

## Key Functions

### Chat (Main Entry Point)

```typescript
import { chatWithContext } from "@/lib/ai/chat";

const { stream, onFinish } = await chatWithContext(
  sessionId,
  userMessage,
  lessonContent,
  { useRag: true },
);

// Stream to client, then onFinish() to save
```

### RAG (Document Retrieval)

```typescript
import { ingestDocument, retrieveRelevantChunks } from "@/lib/ai/rag";

// Ingest PDF
await ingestDocument(userId, lessonId, fileName, text);

// Retrieve chunks for a query
const chunks = await retrieveRelevantChunks(query, userId, lessonId);
```

### Embeddings

```typescript
import {
  generateEmbedding,
  generateEmbeddingsBatch,
} from "@/lib/ai/embeddings";

const embedding = await generateEmbedding("text to embed");
const embeddings = await generateEmbeddingsBatch(texts);
```

### Memory Management

```typescript
import { selectMemoryMessages, buildSystemPrompt } from "@/lib/ai/prompt";

// Keep messages within token budget
const relevant = selectMemoryMessages(messages, { maxTokens: 4000 });

// Build prompt with context injection
const prompt = buildSystemPrompt(lessonContent, ragContext);
```

### Database

```typescript
import db from "@/lib/db";

const session = await db.createSession(userId, lessonId);
session.messages.push({ role: "user", content: "...", timestamp: new Date() });
await db.updateSession(session);
```

### Validation

```typescript
import { validateChatRequest, validatePdfUpload } from "@/lib/utils/validation";

const { message, sessionId } = validateChatRequest(body);
const { file, userId, lessonId } = validatePdfUpload(formData);
```

### Rate Limiting

```typescript
import {
  RATE_LIMITS,
  createRateLimitResponse,
} from "@/lib/middleware/rateLimit";

const result = RATE_LIMITS.chat(req);
if (!result.allowed) {
  return createRateLimitResponse(result.remaining, result.resetTime);
}
```

---

## API Endpoints Cheat Sheet

### Create Session

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"userId":"u1", "lessonId":"l1", "title":"Chat"}'
```

### Send Chat Message

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId":"session_1234567890",
    "message":"What is AI?",
    "lessonContent":"AI is...",
    "useRag":true
  }' | cat
```

### Upload PDF

```bash
curl -X POST http://localhost:3000/api/upload-pdf \
  -F "file=@lecture.pdf" \
  -F "userId=u1" \
  -F "lessonId=l1"
```

### List Sessions

```bash
curl http://localhost:3000/api/sessions?userId=u1
```

### Delete Session

```bash
curl -X DELETE http://localhost:3000/api/sessions/session_1234567890
```

---

## Configuration Tuning

### Adjust Token Budget

**File**: `/lib/ai/prompt.ts`

```typescript
const DEFAULT_MEMORY = {
  maxMessages: 10, // ← Change this
  maxTokens: 4000, // ← Or this
};
```

### Adjust RAG Settings

**File**: `/lib/ai/rag.ts`

```typescript
const DEFAULT_CONFIG = {
  chunkSize: 500, // Bytes per chunk
  topK: 5, // Return top K chunks
  minSimilarityScore: 0.3, // Relevance threshold
};
```

### Adjust Rate Limits

**File**: `/lib/middleware/rateLimit.ts`

```typescript
chat: createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30, // ← Change this
});
```

---

## Common Debugging

### Check Session State

```typescript
// In any API route
import db from "@/lib/db";

const session = await db.getSession("session_id");
console.log(session?.messages);
console.log(session?.tokenCount);
```

### Test Embeddings

```typescript
import { generateEmbedding } from "@/lib/ai/embeddings";

const embedding = await generateEmbedding("test text");
console.log(embedding.length); // Should be 1024
```

### Test Similarity

```typescript
import { cosineSimilarity } from "@/lib/utils/vectorStore";

const score = cosineSimilarity([1, 0, 0, 0], [0.9, 0.1, 0, 0]);
console.log(score); // Should be ~0.9
```

### Check Rate Limit Status

```bash
# In response headers:
X-RateLimit-Remaining: 29
X-RateLimit-Reset: 1711354245000
```

---

## Files to Know

| When You Need to...       | Edit This File                         |
| ------------------------- | -------------------------------------- |
| Add new API endpoint      | `/app/api/*/route.ts`                  |
| Change chat behavior      | `/lib/ai/chat.ts`                      |
| Adjust RAG pipeline       | `/lib/ai/rag.ts`                       |
| Modify memory management  | `/lib/ai/prompt.ts`                    |
| Change embedding provider | `/lib/ai/embeddings.ts`                |
| Edit validation rules     | `/lib/utils/validation.ts`             |
| Switch to MongoDB         | `/lib/db/mongoDb.ts` (create & import) |
| Add new rate limit        | `/lib/middleware/rateLimit.ts`         |

---

## Environment Variables

```env
# Required
GROQ_API_KEY=your_groq_key
COHERE_API_KEY=your_cohere_key

# Optional
MONGODB_URI=mongodb+srv://...
NODE_ENV=development|production
DEBUG=true
```

---

## Error Codes

| Code | Meaning                    | Solution                                      |
| ---- | -------------------------- | --------------------------------------------- |
| 400  | Validation failed          | Check request body format                     |
| 404  | Session/resource not found | Verify IDs are correct                        |
| 429  | Rate limited               | Wait before retrying (see Retry-After header) |
| 500  | Server error               | Check logs, API keys, network                 |

---

## Performance Targets

| Metric             | Target   | Tips                                                         |
| ------------------ | -------- | ------------------------------------------------------------ |
| Chat response time | < 5 sec  | Groq is fast, embedding is main cost                         |
| RAG retrieval      | < 1 sec  | Cosine similarity is O(n), consider vector DB for 1000+ docs |
| Session load       | < 100ms  | In-memory, upgrade to MongoDB if too large                   |
| PDF upload         | < 30 sec | Embedding batch size is 90, tune if slow                     |

---

## Data Model Quick Reference

### ChatSession

```typescript
{
  id: string;
  userId: string;
  lessonId: string;
  messages: ChatMessage[];
  tokenCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### ChatMessage

```typescript
{
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  tokens?: number;
}
```

### Document

```typescript
{
  id: string;
  userId: string;
  lessonId: string;
  chunks: DocumentChunk[];
  totalChunks: number;
  createdAt: Date;
}
```

### DocumentChunk

```typescript
{
  id: string;
  text: string;
  embedding: number[];
  chunkIndex: number;
  metadata?: { pageNumber?, section? };
}
```

---

## Deployment Checklist

- [ ] `GROQ_API_KEY` set in environment
- [ ] `COHERE_API_KEY` set in environment
- [ ] Database migrated (MockDB → MongoDB if scaling)
- [ ] Rate limits configured for expected traffic
- [ ] Error logging set up (Sentry, LogRocket)
- [ ] Monitoring configured (latency, token usage)
- [ ] Load tested at expected scale

---

## Quick Links

- [Full Architecture](ARCHITECTURE.md)
- [API Reference](API_GUIDE.md)
- [Setup & Troubleshooting](SETUP_GUIDE.md)
- [Groq Docs](https://console.groq.com/docs)
- [Cohere Docs](https://docs.cohere.com)

---

**Ready to test?** → Start with `SETUP_GUIDE.md#quick-start`

**Need API details?** → Check `API_GUIDE.md`

**Want architecture deep-dive?** → Read `ARCHITECTURE.md`
