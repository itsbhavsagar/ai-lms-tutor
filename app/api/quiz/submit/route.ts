import { prisma } from "@/lib/db/prisma";
import { jsonApiError } from "@/lib/utils/apiError";

export async function POST(req: Request) {
  try {
    const { quizId, score, total, weakConcepts } = await req.json();

    if (!quizId || score === undefined || !total) {
      return Response.json(
        { error: "quizId, score, and total are required" },
        { status: 400 },
      );
    }

    const concepts =
      Array.isArray(weakConcepts)
        ? weakConcepts.filter((c: unknown) => typeof c === "string")
        : [];

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        score,
        total,
        weakConcepts: concepts,
      },
    });

    return Response.json({ attempt });
  } catch (error) {
    console.error("[Quiz Submit] POST error:", error);
    return jsonApiError(error, "Failed to submit quiz");
  }
}
