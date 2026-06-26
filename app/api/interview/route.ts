import Groq from "groq-sdk";
import { buildMockInterviewSystemPrompt } from "@/lib/ai/prompts/mock-interview";
import { getLessonById } from "@/lib/curriculum";
import { buildLearnerProfileSafe } from "@/lib/db/learner-profile";
import { getQuizPerformanceSafe } from "@/lib/db/quiz-performance";
import { jsonApiError } from "@/lib/utils/apiError";
import {
  RATE_LIMITS,
  createRateLimitResponse,
} from "@/lib/middleware/rateLimit";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

type Message = { role: "user" | "assistant"; content: string };

const MAX_HISTORY = 12;
const MAX_CHARS = 2000;

function sanitizeMessages(messages: unknown[]): Message[] {
  return messages
    .filter((m) => {
      if (typeof m !== "object" || m === null) return false;
      const msg = m as Message;
      return (
        (msg.role === "user" || msg.role === "assistant") &&
        typeof msg.content === "string" &&
        msg.content.trim().length > 0
      );
    })
    .map((m) => ({
      role: (m as Message).role,
      content: String((m as Message).content).slice(0, MAX_CHARS).trim(),
    }));
}

export async function POST(req: Request) {
  try {
    const rateLimitResult = RATE_LIMITS.chat(req);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(
        rateLimitResult.remaining,
        rateLimitResult.resetTime,
      );
    }

    const body = await req.json();
    const { lessonId, userId, messages } = body;

    if (!lessonId || !userId || !Array.isArray(messages)) {
      return Response.json(
        { error: "lessonId, userId, and messages are required" },
        { status: 400 },
      );
    }

    const lesson = getLessonById(lessonId);
    if (!lesson) {
      return Response.json({ error: "Lesson not found" }, { status: 404 });
    }

    const [quizPerformance, profile] = await Promise.all([
      getQuizPerformanceSafe(userId, lessonId),
      buildLearnerProfileSafe(userId, lessonId),
    ]);

    const systemPrompt = buildMockInterviewSystemPrompt(
      lesson,
      quizPerformance,
      profile,
    );
    const recentMessages = sanitizeMessages(messages).slice(-MAX_HISTORY);

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      stream: true,
      temperature: 0.5,
      max_tokens: 400,
      messages: [
        { role: "system", content: systemPrompt },
        ...recentMessages,
      ],
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices?.[0]?.delta?.content;
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (err) {
          console.error("[Interview] Stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Interview] API error:", error);
    return jsonApiError(error, "Interview failed");
  }
}
