import { prisma } from "@/lib/db/prisma";

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
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}
