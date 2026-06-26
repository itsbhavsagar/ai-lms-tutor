import { deleteSession } from "@/lib/db/session";
import { jsonApiError } from "@/lib/utils/apiError";
import {
  RATE_LIMITS,
  createRateLimitResponse,
} from "@/lib/middleware/rateLimit";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const rateLimitResult = RATE_LIMITS.api(_req);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(
        rateLimitResult.remaining,
        rateLimitResult.resetTime,
      );
    }

    const { sessionId } = await context.params;

    if (!sessionId) {
      return Response.json({ error: "sessionId is required" }, { status: 400 });
    }

    await deleteSession(sessionId);

    return Response.json(
      { success: true },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        },
      },
    );
  } catch (error) {
    console.error("Session delete error:", error);
    return jsonApiError(error, "Failed to delete chat");
  }
}
