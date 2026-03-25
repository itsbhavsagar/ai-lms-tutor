import {
  createSession,
  getUserSessions,
  deleteSession,
} from "@/lib/db/session";
import { validateSessionRequest } from "@/lib/utils/validation";
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
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
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

    // List sessions
    const sessions = await getUserSessions(userId);

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

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to list sessions",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    // Rate limiting
    const rateLimitResult = RATE_LIMITS.api(req);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(
        rateLimitResult.remaining,
        rateLimitResult.resetTime,
      );
    }

    // Extract sessionId from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const sessionId = pathParts[pathParts.length - 1];

    if (!sessionId || sessionId === "sessions") {
      return Response.json(
        {
          error: "sessionId is required in URL path",
        },
        {
          status: 400,
        },
      );
    }

    // Delete session
    await deleteSession(sessionId);

    return Response.json(
      {
        success: true,
        message: "Session deleted",
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        },
      },
    );
  } catch (error) {
    console.error("Session delete error:", error);

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete session",
      },
      {
        status: 500,
      },
    );
  }
}
