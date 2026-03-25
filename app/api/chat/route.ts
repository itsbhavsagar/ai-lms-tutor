import { chatWithContext } from "@/lib/ai/chat";
import { validateChatRequest } from "@/lib/utils/validation";
import {
  RATE_LIMITS,
  createRateLimitResponse,
} from "@/lib/middleware/rateLimit";

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

    const lessonContent = (body as any).lessonContent || "";
    const useRag = (body as any).useRag !== false;

    try {
      const chatResponse = await chatWithContext(
        sessionId,
        userMessage,
        lessonContent,
        {
          useRag,
        },
      );

      const encoder = new TextEncoder();
      let fullResponse = "";

      const readable = new ReadableStream({
        async start(controller) {
          try {
            const reader = chatResponse.stream.getReader();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const text = new TextDecoder().decode(value);
              fullResponse += text;
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

      return Response.json(
        { error: error instanceof Error ? error.message : "Internal error" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Chat API error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return new Response(JSON.stringify({ error: message }), {
      status:
        error instanceof Error && error.message.includes("not found")
          ? 404
          : 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
