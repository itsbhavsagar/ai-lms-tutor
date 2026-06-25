import {
  createSession,
  getUserSessions,
} from "@/lib/db/session";
import { validateSessionRequest } from "@/lib/utils/validation";
import { jsonApiError } from "@/lib/utils/apiError";
import {
  RATE_LIMITS,
  createRateLimitResponse,
} from "@/lib/middleware/rateLimit";

export async function POST(req: Request) {
  try {
    const rateLimitResult = RATE_LIMITS.api(req);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(
        rateLimitResult.remaining,
        rateLimitResult.resetTime,
      );
    }

    const body = await req.json();
    const { userId, lessonId, title } = validateSessionRequest(body);

    // Create session
    const session = await createSession(userId, lessonId, title);

    return Response.json(
      {
        success: true,
        session,
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        },
      },
    );
  } catch (error) {
    console.error("Session create error:", error);
    return jsonApiError(error, "Failed to create session");
  }
}

export async function GET(req: Request) {
  try {
    // Rate limiting
    const rateLimitResult = RATE_LIMITS.api(req);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(
        rateLimitResult.remaining,
        rateLimitResult.resetTime,
      );
    }

    // Get userId from query params
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    const lessonId = url.searchParams.get("lessonId");

    if (!userId) {
      return Response.json(
        {
          error: "userId query parameter is required",
        },
        {
          status: 400,
        },
      );
    }

    const sessions = await getUserSessions(userId, lessonId ?? undefined);

    return Response.json(
      {
        success: true,
        sessions,
        count: sessions.length,
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        },
      },
    );
  } catch (error) {
    console.error("Session list error:", error);
    return jsonApiError(error, "Failed to list sessions");
  }
}
