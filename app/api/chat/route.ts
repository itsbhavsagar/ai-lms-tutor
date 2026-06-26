import { getLessonById } from "@/lib/curriculum";
import {
  chatWithoutDatabase,
  chatWithContext,
  type ClientChatMessage,
} from "@/lib/ai/chat";
import {
  buildLearnerProfileSafe,
  emptyLearnerProfile,
} from "@/lib/db/learner-profile";
import { isEphemeralSessionId } from "@/lib/db/ephemeral-session";
import { validateChatRequest } from "@/lib/utils/validation";
import { jsonApiError } from "@/lib/utils/apiError";
import {
  RATE_LIMITS,
  createRateLimitResponse,
} from "@/lib/middleware/rateLimit";

function parseClientMessages(body: unknown): ClientChatMessage[] {
  if (!body || typeof body !== "object") return [];
  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages)) return [];

  return messages.filter(
    (m): m is ClientChatMessage =>
      typeof m === "object" &&
      m !== null &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim().length > 0,
  );
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

    let message = body.message;

    if (!message && Array.isArray(body.messages)) {
      message = body.messages[body.messages.length - 1]?.content;
    }

    const normalizedBody = {
      ...body,
      message,
    };

    const { message: userMessage, sessionId } =
      validateChatRequest(normalizedBody);

    const lessonId = body.lessonId as string | undefined;
    const userId = body.userId as string | undefined;

    if (!lessonId) {
      return Response.json({ error: "lessonId is required" }, { status: 400 });
    }

    const lesson = getLessonById(lessonId);
    if (!lesson) {
      return Response.json({ error: "Lesson not found" }, { status: 404 });
    }

    const profile = userId
      ? await buildLearnerProfileSafe(userId, lessonId)
      : emptyLearnerProfile();

    const clientMessages = parseClientMessages(body);

    try {
      const chatResponse = isEphemeralSessionId(sessionId)
        ? await chatWithoutDatabase(
            userMessage,
            clientMessages,
            lesson,
            profile,
          )
        : await chatWithContext(
            sessionId,
            userMessage,
            lesson,
            profile,
            {},
            clientMessages,
          );

      const encoder = new TextEncoder();

      const readable = new ReadableStream({
        async start(controller) {
          try {
            const reader = chatResponse.stream.getReader();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const text = new TextDecoder().decode(value);
              controller.enqueue(encoder.encode(text));
            }

            controller.close();
            await chatResponse.onFinish();
          } catch (error) {
            console.error("Streaming error:", error);
            controller.error(error);
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (error) {
      console.error("Chat error:", error);

      if (
        error instanceof Error &&
        error.message.includes("Session") &&
        error.message.includes("not found")
      ) {
        return Response.json(
          { error: `Session ${sessionId} not found` },
          { status: 404 },
        );
      }

      return jsonApiError(error, "Chat failed", 500);
    }
  } catch (error) {
    console.error("Chat API error:", error);

    const status =
      error instanceof Error && error.message.includes("not found") ? 404 : 500;

    return jsonApiError(error, "Chat failed", status);
  }
}
