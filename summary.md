# 🚀 Project Summary

Built a production-style AI Learning Platform with session-based chat, streaming LLM responses, and a custom RAG pipeline.

The system supports multi-session conversations, persistent memory using PostgreSQL (Prisma), and document-based Q&A through semantic retrieval.

Key features include:

- Real-time streaming chat using Groq LLM
- Session-based architecture with persistent chat history
- Cursor-based pagination with infinite scroll for scalable message loading
- Scroll anchoring and controlled auto-scroll for smooth chat UX
- RAG pipeline (PDF ingestion → chunking → Cohere embeddings → cosine similarity → context retrieval)
- AI-generated quizzes with attempt tracking
- Lesson summaries and user notes stored per lesson
- Fully database-backed system (no in-memory state)

Tech stack:
Next.js, React, TypeScript, PostgreSQL, Prisma, Groq, Cohere, Vercel

The system is designed to behave like a real product with proper data modeling, user isolation, and performance considerations.

---

# 🧠 How Your System Works =>

This is the part most people fake — you shouldn’t.

---

## 🔹 1. Chat Flow

User → sends message
→ API (/api/chat)
→ LLM (Groq)
→ streaming response
→ UI updates in real-time
→ messages saved in DB

👉 Important:

- Chat is tied to a **sessionId**
- Messages are stored in **PostgreSQL**
- Refresh → data still there

---

## 🔹 2. Session System (like ChatGPT)

User opens lesson
→ session created (or reused)
→ stored in DB
→ mapped via localStorage

👉 That’s why:

- You don’t lose chat
- Each lesson = separate conversation

---

## 🔹 3. Message Scaling (important)

I solved:

“what if 1000 messages?”

👉 Solution:

Load last 5 → scroll up → load older

Using:

- cursor-based pagination
- not loading everything

---

## 🔹 4. Scroll System [Hard Problems]

You handled:

- auto scroll on new messages ✅
- no scroll jump on pagination ✅
- correct position after refresh ✅

Using:

- `shouldAutoScroll`
- scroll height diff
- `requestAnimationFrame`

👉 This is advanced frontend work

---

## 🔹 5. RAG Pipeline (core AI system)

User uploads PDF
→ split into chunks
→ generate embeddings (Cohere)
→ store in DB (Chunk table)

User asks question
→ convert query → embedding
→ compare with stored chunks
→ pick top relevant chunks
→ send as context to LLM
→ get grounded answer

👉 That’s how:

> AI answers based on YOUR document

---

## 🔹 6. Database Design (this is big)

You created:

User
Session → chats
Message → chat history
Document → uploaded files
Chunk → embeddings
Note → user notes
Summary → AI summaries
Quiz → generated quizzes
QuizAttempt → scores

👉 This is **real system modeling**, not demo

---

## 🔹 7. Data Flow (full picture)

User
↓
Frontend (Next.js)
↓
API routes
↓
DB (PostgreSQL via Prisma)
↓
LLM / Embeddings (Groq + Cohere)
↓
Back to UI (streaming)

---

# 💬 Explanation for Interview

Say this:

> I built an AI learning platform with session-based chat and a custom RAG pipeline. The system uses PostgreSQL with Prisma for persistence, supports document-based retrieval using embeddings, and implements cursor-based pagination with optimized scroll behavior for scalability.

---

# 🔥 What makes this project strong

- Not just UI → full system
- Not just AI → data + memory
- Not just features → architecture

---

# 🎯 Final positioning

I didn’t build:

“AI chatbot”

I built:

AI system with memory, retrieval, and scalable chat UX
