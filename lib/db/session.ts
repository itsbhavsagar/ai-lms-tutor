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

export async function getUserSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      messages: true,
    },
  });
}

export async function deleteSession(sessionId: string) {
  return prisma.session.delete({
    where: { id: sessionId },
  });
}
