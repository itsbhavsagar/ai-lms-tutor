import { prisma } from "@/lib/db/prisma";
import { buildLearnerProfileSafe } from "@/lib/db/learner-profile";
import { jsonApiError } from "@/lib/utils/apiError";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const lessonId = url.searchParams.get("lessonId");

    if (!userId || !lessonId) {
      return Response.json(
        { error: "userId and lessonId are required" },
        { status: 400 },
      );
    }

    const profile = await buildLearnerProfileSafe(userId, lessonId);
    return Response.json({ profile });
  } catch (error) {
    console.error("[LearnerProfile] GET error:", error);
    return jsonApiError(error, "Failed to load learner profile");
  }
}
