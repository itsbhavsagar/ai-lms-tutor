import { prisma } from "@/lib/db/prisma";
import { jsonApiError } from "@/lib/utils/apiError";

export async function POST(req: Request) {
  try {
    const { quizId, score, total } = await req.json();

    if (!quizId || score === undefined || !total) {
      return Response.json(
        { error: "quizId, score, and total are required" },
        { status: 400 },
      );
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        score,
        total,
      },
    });

    console.log(
      `[Quiz] Attempt recorded: ${attempt.id} - Score: ${score}/${total}`,
    );

    return Response.json({ attempt });
  } catch (error) {
    console.error("[Quiz Submit] POST error:", error);
    return jsonApiError(error, "Failed to submit quiz");
  }
}
