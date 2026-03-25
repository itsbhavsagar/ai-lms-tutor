# AI LMS Tutor - Production-Grade Backend

A **full-stack AI learning system** built with Next.js 16, React 19, and enterprise-grade architecture.

## 🚀 What's Inside

- **Real RAG Pipeline** - PDF ingestion, semantic chunking, embeddings via Cohere
- **Streaming Chat** - Real-time responses with Groq API
- **Session Persistence** - Full conversation history with memory management
- **Production Architecture** - Clean separation of concerns, type-safe, scalable
- **Security Built-in** - Rate limiting, input validation, server-side API keys
- **Modular Design** - Swap components (MockDB → MongoDB, easily extend features)

## 📚 Documentation

Start here based on your needs:

1. **[ARCHITECTURE.md](ARCHITECTURE.md)** → Understand the system design
   - Layer breakdown (API, orchestration, RAG, DB)
   - Data flow diagrams
   - Design decisions explained

2. **[API_GUIDE.md](API_GUIDE.md)** → Learn the endpoints
   - `/api/chat` (streaming)
   - `/api/sessions` (CRUD)
   - `/api/upload-pdf` (RAG ingestion)
   - Complete examples

3. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** → Get it running
   - Quick start
   - Testing (cURL, Postman, code)
   - Configuration tuning
   - Troubleshooting

## 🏗️ Folder Structure

```
lib/
├── db/                 # Database abstraction + schemas
├── ai/                 # Chat, RAG, embeddings orchestration
├── utils/              # PDF parsing, text processing, vector search
└── middleware/         # Rate limiting, validation

app/api/
├── chat/              # Streaming chat endpoint
├── sessions/          # Session management
└── upload-pdf/        # Document ingestion
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed explanation.

## 🚀 Quick Start

### 1. Set Up Environment

```bash
# Install dependencies
npm install

# Create .env.local with:
GROQ_API_KEY=your_groq_key
COHERE_API_KEY=your_cohere_key
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test the API

```bash
# Create a session
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"userId": "test", "lessonId": "lesson1", "title": "Chat"}'

# Send a message (streaming)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_returned_above",
    "message": "Explain machine learning",
    "lessonContent": "Machine learning is...",
    "useRag": false
  }'

# Upload a PDF for RAG
curl -X POST http://localhost:3000/api/upload-pdf \
  -F "file=@lecture.pdf" \
  -F "userId=test" \
  -F "lessonId=lesson1"
```

For more examples, see [API_GUIDE.md](API_GUIDE.md#complete-chat-flow-example).

## 🎯 Key Features

### Streaming Chat with Context

- ✅ Real-time responses (SSE)
- ✅ Session memory (last N messages)
- ✅ Token budget management
- ✅ RAG context injection

### RAG Pipeline

- ✅ PDF extraction (pdf2json)
- ✅ Semantic chunking
- ✅ Embedding generation (Cohere)
- ✅ Cosine similarity search

### Session Management

- ✅ Persistent conversation history
- ✅ Token counting per session
- ✅ Auto-save on message completion
- ✅ List/delete sessions

### Security & Performance

- ✅ Rate limiting (configurable per endpoint)
- ✅ Input validation with typed errors
- ✅ API keys server-side only
- ✅ Memory limits (prevent token overflow)

## 🔧 Configuration

### RAG Settings

Edit `/lib/ai/rag.ts`:

```typescript
const DEFAULT_CONFIG = {
  chunkSize: 500, // Bytes per chunk
  topK: 5, // Return top 5 similar chunks
  minSimilarityScore: 0.3, // Relevance threshold
};
```

### Memory/Token Budget

Edit `/lib/ai/prompt.ts`:

```typescript
const DEFAULT_MEMORY = {
  maxMessages: 10, // Keep last 10 messages
  maxTokens: 4000, // Total context limit
};
```

### Rate Limits

Edit `/lib/middleware/rateLimit.ts`:

```typescript
chat: createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30, // 30 requests per minute
});
```

## 📊 Architecture Overview

```
User Request
    ↓
[API Route] /api/chat
    ↓
Rate Limit Check
    ↓
Input Validation
    ↓
chatWithContext() ← Main orchestration
    ├─→ Load session (DB)
    ├─→ Select memory messages (token budget)
    ├─→ retrieveRelevantChunks() ← RAG pipeline
    │   ├─→ Generate query embedding
    │   ├─→ Find top K similar chunks
    │   └─→ Return with scores
    ├─→ Build system prompt (lesson + RAG)
    ├─→ Stream from Groq
    └─→ Save to session
    ↓
Stream SSE Response
```

See [ARCHITECTURE.md](ARCHITECTURE.md#data-flow) for full diagrams.

## 🗄️ Database

Currently uses **in-memory MockDB** (great for development).

To migrate to MongoDB for production:

```typescript
// /lib/db/index.ts
const db =
  process.env.NODE_ENV === "production"
    ? new MongoDatabase() // Create this class
    : new MockDatabase();
```

See [ARCHITECTURE.md](ARCHITECTURE.md#database-migration-mockdb--mongodb) for details.

## 🧪 Testing Examples

### Unit Test

```typescript
import { cosineSimilarity } from "@/lib/utils/vectorStore";

test("cosine similarity", () => {
  expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
});
```

### Integration Test

```typescript
const session = await db.createSession("user1", "lesson1");
session.messages.push({ role: "user", content: "Hi", timestamp: new Date() });
await db.updateSession(session);
const loaded = await db.getSession(session.id);
expect(loaded?.messages).toHaveLength(1);
```

## 📈 Production Checklist

- [ ] Environment variables set (Vercel/hosting)
- [ ] Migrate to MongoDB (replace MockDB)
- [ ] Add authentication (validate userId)
- [ ] Monitor API costs (Groq, Cohere tokens)
- [ ] Set up error logging (Sentry/LogRocket)
- [ ] Add analytics (usage, latency)
- [ ] Load test rate limits
- [ ] Cache embeddings for repeated queries

## 🔗 Resources

- [Groq Console](https://console.groq.com) - API keys & usage
- [Cohere Dashboard](https://dashboard.cohere.com) - Embeddings
- [Vercel AI SDK](https://sdk.vercel.ai) - Streaming & providers
- [Next.js Docs](https://nextjs.org/docs) - App Router API routes

## 📝 API Summary

| Endpoint            | Method | Purpose                  |
| ------------------- | ------ | ------------------------ |
| `/api/sessions`     | POST   | Create session           |
| `/api/sessions`     | GET    | List sessions            |
| `/api/sessions/:id` | DELETE | Delete session           |
| `/api/chat`         | POST   | Send message (streaming) |
| `/api/upload-pdf`   | POST   | Upload PDF (RAG)         |

Full details: [API_GUIDE.md](API_GUIDE.md)

## 🤔 Need Help?

1. Check [SETUP_GUIDE.md](SETUP_GUIDE.md#troubleshooting)
2. Review [ARCHITECTURE.md](ARCHITECTURE.md#assumptions) for assumptions
3. See [API_GUIDE.md](API_GUIDE.md#error-handling) for error codes

## 📄 License

Built for production. Use, modify, extend freely.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
