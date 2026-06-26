import { prisma } from "@/lib/db/prisma";
import { isEphemeralSessionId } from "@/lib/db/ephemeral-session";

const PAGE_SIZE = 5;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  const cursor = url.searchParams.get("cursor");

  if (!sessionId) {
    return Response.json({ error: "sessionId required" }, { status: 400 });
  }

  if (isEphemeralSessionId(sessionId)) {
    return Response.json({ messages: [], nextCursor: null });
  }

  let messages;
  let nextCursor: string | null = null;

  if (cursor) {
    messages = await prisma.message.findMany({
      where: { sessionId },
      take: PAGE_SIZE,
      skip: 1,
      cursor: { id: cursor },
      orderBy: { createdAt: "desc" },
    });
  } else {
    messages = await prisma.message.findMany({
      where: { sessionId },
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
    });
  }

  messages.reverse();

  if (messages.length === PAGE_SIZE) {
    nextCursor = messages[0]?.id || null;
  }

  return Response.json({ messages, nextCursor });
}
