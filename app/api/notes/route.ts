import { prisma } from "@/lib/db/prisma";
import { deriveNoteTitle } from "@/lib/notes/title";
import { jsonApiError } from "@/lib/utils/apiError";

async function ensureUser(userId: string) {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: `${userId}@temp.local` },
  });
}

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

    const notes = await prisma.note.findMany({
      where: { userId, lessonId },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json({ notes });
  } catch (error) {
    console.error("[Notes] GET error:", error);
    return jsonApiError(error, "Failed to load notes");
  }
}

export async function POST(req: Request) {
  try {
    const { userId, lessonId, title, content } = await req.json();

    if (!userId || !lessonId) {
      return Response.json(
        { error: "userId and lessonId are required" },
        { status: 400 },
      );
    }

    await ensureUser(userId);

    const body = typeof content === "string" ? content : "";
    const note = await prisma.note.create({
      data: {
        userId,
        lessonId,
        title: deriveNoteTitle(title, body),
        content: body,
      },
    });

    return Response.json({ note });
  } catch (error) {
    console.error("[Notes] POST error:", error);
    return jsonApiError(error, "Failed to create note");
  }
}

export async function PATCH(req: Request) {
  try {
    const { noteId, title, content } = await req.json();

    if (!noteId) {
      return Response.json({ error: "noteId is required" }, { status: 400 });
    }

    if (typeof content !== "string") {
      return Response.json({ error: "content is required" }, { status: 400 });
    }

    const note = await prisma.note.update({
      where: { id: noteId },
      data: {
        title: deriveNoteTitle(title, content),
        content,
      },
    });

    return Response.json({ note });
  } catch (error) {
    console.error("[Notes] PATCH error:", error);
    return jsonApiError(error, "Failed to save note");
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const noteId = url.searchParams.get("noteId");

    if (!noteId) {
      return Response.json({ error: "noteId is required" }, { status: 400 });
    }

    await prisma.note.delete({ where: { id: noteId } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("[Notes] DELETE error:", error);
    return jsonApiError(error, "Failed to delete note");
  }
}
