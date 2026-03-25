# API Reference & Usage Guide

## Endpoints Overview

| Endpoint             | Method   | Purpose                            |
| -------------------- | -------- | ---------------------------------- |
| `/api/chat`          | `POST`   | Stream chat responses with context |
| `/api/sessions`      | `POST`   | Create new chat session            |
| `/api/sessions`      | `GET`    | List user's sessions               |
| `/api/sessions/{id}` | `DELETE` | Delete a session                   |
| `/api/upload-pdf`    | `POST`   | Ingest PDF into RAG system         |

---

## 1. Create Chat Session

**Endpoint**: `POST /api/sessions`

**Request**:

```json
{
  "userId": "user_12345",
  "lessonId": "lesson_abc",
  "title": "Quantum Physics Discussion" // optional
}
```

**Response**:

```json
{
  "success": true,
  "session": {
    "id": "session_1234567890",
    "userId": "user_12345",
    "lessonId": "lesson_abc",
    "title": "Quantum Physics Discussion",
    "messages": [],
    "createdAt": "2026-03-25T10:00:00Z",
    "updatedAt": "2026-03-25T10:00:00Z",
    "tokenCount": 0
  }
}
```

---

## 2. Send Chat Message (Streaming)

**Endpoint**: `POST /api/chat`

**Request**:

```json
{
  "sessionId": "session_1234567890",
  "message": "Explain quantum entanglement",
  "lessonContent": "Quantum mechanics chapter content...",
  "useRag": true // optional, default: true
}
```

**Response**: Text stream (SSE)

```
Quantum entanglement is a phenomenon where...
```

**Client Code** (React):

```typescript
async function sendMessage(sessionId: string, message: string) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      message,
      lessonContent: "Your lesson material...",
      useRag: true,
    }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const text = decoder.decode(value);
    // Append to chat UI
    console.log(text);
  }
}
```

---

## 3. Upload PDF (RAG Ingestion)

**Endpoint**: `POST /api/upload-pdf`

**Request**: FormData

```typescript
const formData = new FormData();
formData.append("file", pdfFile); // File object
formData.append("userId", "user_12345");
formData.append("lessonId", "lesson_abc");
```

**Response**:

```json
{
  "success": true,
  "documentId": "doc_1234567890",
  "chunksCreated": 42,
  "message": "Successfully ingested 42 chunks from lecture.pdf"
}
```

**Client Code** (React):

```typescript
async function uploadPDF(file: File, userId: string, lessonId: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);
  formData.append("lessonId", lessonId);

  const response = await fetch("/api/upload-pdf", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (data.success) {
    console.log(`Ingested ${data.chunksCreated} chunks`);
  }
}
```

---

## 4. List Sessions

**Endpoint**: `GET /api/sessions?userId=user_12345`

**Response**:

```json
{
  "success": true,
  "sessions": [
    {
      "id": "session_1234567890",
      "userId": "user_12345",
      "lessonId": "lesson_abc",
      "title": "Quantum Physics Discussion",
      "messages": [
        {
          "role": "user",
          "content": "What is superposition?",
          "timestamp": "2026-03-25T10:05:00Z"
        },
        {
          "role": "assistant",
          "content": "Superposition is...",
          "timestamp": "2026-03-25T10:05:05Z"
        }
      ],
      "createdAt": "2026-03-25T10:00:00Z",
      "updatedAt": "2026-03-25T10:30:00Z",
      "tokenCount": 1250
    }
  ],
  "count": 1
}
```

---

## 5. Delete Session

**Endpoint**: `DELETE /api/sessions/session_1234567890`

**Response**:

```json
{
  "success": true,
  "message": "Session deleted"
}
```

---

## Error Handling

### Validation Errors (400)

```json
{
  "error": "Message must be a non-empty string"
}
```

### Rate Limited (429)

```json
{
  "error": "Rate limit exceeded",
  "remaining": 0,
  "retryAfter": 45
}

Headers:
  Retry-After: 45
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: 1711354245000
```

### Not Found (404)

```json
{
  "error": "Session session_invalid not found"
}
```

### Server Error (500)

```json
{
  "error": "Failed to generate embeddings: API rate limit exceeded"
}
```

---

## Rate Limits

| Endpoint          | Limit  | Window  |
| ----------------- | ------ | ------- |
| `/api/chat`       | 30 req | 60 sec  |
| `/api/sessions`   | 60 req | 60 sec  |
| `/api/upload-pdf` | 10 req | 600 sec |

---

## Complete Chat Flow Example

```typescript
// 1. Create session
const sessionRes = await fetch("/api/sessions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: "user_123",
    lessonId: "lesson_456",
    title: "Learning Session",
  }),
});

const { session } = await sessionRes.json();
const sessionId = session.id;

// 2. Upload lesson material (PDF)
const pdfForm = new FormData();
pdfForm.append("file", lessonPdfFile);
pdfForm.append("userId", "user_123");
pdfForm.append("lessonId", "lesson_456");

await fetch("/api/upload-pdf", {
  method: "POST",
  body: pdfForm,
});

// 3. Send first message
const chatRes = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sessionId,
    message: "Can you summarize the first chapter?",
    lessonContent: "Chapter content...",
    useRag: true, // Will use PDF chunks
  }),
});

// 4. Stream response
const reader = chatRes.body.getReader();
const decoder = new TextDecoder();

let fullResponse = "";
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  fullResponse += decoder.decode(value);
  updateUI(fullResponse); // Update in real-time
}

// 5. Session is auto-saved with message + response

// 6. Later: retrieve session history
const sessionsRes = await fetch(`/api/sessions?userId=user_123`);
const { sessions } = await sessionsRes.json();
console.log(sessions[0].messages); // Full conversation history
```

---

## Configuration Examples

### Disable RAG (Use only lesson content)

```json
{
  "sessionId": "...",
  "message": "...",
  "lessonContent": "...",
  "useRag": false
}
```

### Programmatic Session Access

From server-side code:

```typescript
import { chatWithContext, getSessionMessages } from "@/lib/ai/chat";

// Get previous messages
const messages = await getSessionMessages("session_id");

// Send message with custom config
const { stream, onFinish } = await chatWithContext(
  "session_id",
  "User question here",
  "Lesson material...",
  {
    useRag: true,
    maxContextMessages: 5,
    maxContextTokens: 2000,
    customSystemPrompt: "Extra instructions...",
  },
);

// Handle stream
const reader = stream.getReader();
let response = "";
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  response += new TextDecoder().decode(value);
}

// Save to session
await onFinish(response);
```

---

## Performance Tips

1. **Batch PDF Uploads**: Large PDFs are automatically chunked. Each chunk generates an embedding (~$0.001 via Cohere).

2. **Reuse Sessions**: Don't create new session per message. Keep session alive and just append messages.

3. **Cache Embeddings**: If same user asks same question twice, embeddings are recalculated. Consider caching.

4. **Monitor Token Usage**: Each session tracks `tokenCount`. Use it to warn users about large conversations.

5. **Set RAG Appropriately**:
   - Enable RAG when PDFs uploaded
   - Disable for pure conversation
   - Tune `topK` and `minSimilarityScore` based on document size

---

## Troubleshooting

**Problem**: "Rate limit exceeded"

- **Solution**: Reduce request frequency. Chat limit is 30/min for cost control.

**Problem**: "Session not found"

- **Solution**: Verify sessionId is correct. Sessions are in-memory in MockDB (cleared on server restart).

**Problem**: Slow RAG retrieval

- **Solution**: Many documents? Upgrade to vector DB (Pinecone, Weaviate).

**Problem**: Missing context in response

- **Solution**:
  1. Verify PDF was uploaded successfully
  2. Check `useRag: true` in request
  3. Check similarity threshold (default: 0.3)

**Problem**: Memory/token limit errors

- **Solution**: Reduce `maxMessages` or `maxTokens` in memory config.

---

## Next Steps

1. Test endpoints with Postman/cURL
2. Update React components to use new session-based API
3. Add loading states for streaming
4. Implement session persistence UI
5. Monitor costs (Cohere embeddings, Groq API)
