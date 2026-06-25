import { prisma } from "./prisma";

export async function createSession(
  userId: string,
  lessonId: string,
  title?: string,
) {
  try {
    // Ensure user exists
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `${userId}@example.com`,
      },
    });

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        lessonId,
        title,
      },
    });

    return session;
  } catch (error) {
    console.error("🔥 Prisma createSession error:", error);
    throw error;
  }
}

export async function getUserSessions(userId: string, lessonId?: string) {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      ...(lessonId ? { lessonId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        where: { role: "user" },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
      _count: { select: { messages: true } },
    },
  });

  return sessions.map((session) => ({
    id: session.id,
    lessonId: session.lessonId,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    messageCount: session._count.messages,
    preview: session.messages[0]?.content ?? null,
  }));
}

export async function deleteSession(sessionId: string) {
  await prisma.message.deleteMany({ where: { sessionId } });
  return prisma.session.delete({
    where: { id: sessionId },
  });
}
