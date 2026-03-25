import { prisma } from "@/lib/db/prisma";

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

    const note = await prisma.note.findFirst({
      where: {
        userId,
        lessonId,
      },
    });

    return Response.json({ note: note || null });
  } catch (error) {
    console.error("[Notes] GET error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId, lessonId, content } = await req.json();

    if (!userId || !lessonId) {
      return Response.json(
        { error: "userId and lessonId are required" },
        { status: 400 },
      );
    }

    // Ensure user exists in database
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: `${userId}@temp.local` },
    });

    // Find existing note
    const existing = await prisma.note.findFirst({
      where: {
        userId,
        lessonId,
      },
    });

    if (existing) {
      // Update existing note
      const updated = await prisma.note.update({
        where: { id: existing.id },
        data: { content },
      });
      console.log(`[Notes] Updated note: ${updated.id}`);
      return Response.json({ note: updated });
    } else {
      // Create new note
      const note = await prisma.note.create({
        data: {
          userId,
          lessonId,
          content: content || "",
        },
      });
      console.log(`[Notes] Created note: ${note.id}`);
      return Response.json({ note });
    }
  } catch (error) {
    console.error("[Notes] POST error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}
