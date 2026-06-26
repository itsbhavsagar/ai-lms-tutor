import { prisma } from "@/lib/db/prisma";
import { getLessonById } from "@/lib/curriculum";
import { getKnowledgeNode } from "@/lib/curriculum/knowledge-graph";
import {
  findQuizAttemptsForProfile,
} from "@/lib/db/quiz-attempt";

export type LearnerProfile = {
  strongConcepts: string[];
  weakConcepts: string[];
  recentQuizScore: string | null;
  recentQuizPercent: number | null;
  noteTopics: string[];
  chatSessionCount: number;
  recentChatTopics: string[];
  interviewCompleted: boolean;
  crossLessonStrong: string[];
  crossLessonWeak: string[];
};

export function emptyLearnerProfile(): LearnerProfile {
  return {
    strongConcepts: [],
    weakConcepts: [],
    recentQuizScore: null,
    recentQuizPercent: null,
    noteTopics: [],
    chatSessionCount: 0,
    recentChatTopics: [],
    interviewCompleted: false,
    crossLessonStrong: [],
    crossLessonWeak: [],
  };
}

/** Returns empty profile if the database is unreachable — AI features still work. */
export async function buildLearnerProfileSafe(
  userId: string,
  lessonId: string,
): Promise<LearnerProfile> {
  try {
    return await buildLearnerProfile(userId, lessonId);
  } catch (error) {
    console.error("[LearnerProfile] DB unavailable, using empty profile:", error);
    return emptyLearnerProfile();
  }
}

async function buildLearnerProfile(
  userId: string,
  lessonId: string,
): Promise<LearnerProfile> {
  const lesson = getLessonById(lessonId);
  const node = getKnowledgeNode(lessonId);

  const [quizRow, sessions, notes, allQuizRows] = await Promise.all([
    prisma.quiz.findFirst({
      where: { userId, lessonId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
    prisma.session.findMany({
      where: { userId, lessonId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 4 },
      },
    }),
    prisma.note.findMany({
      where: { userId, lessonId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { title: true, content: true },
    }),
    prisma.quiz.findMany({
      where: { userId },
      select: { id: true, lessonId: true },
    }),
  ]);

  const quizAttempts = quizRow
    ? await findQuizAttemptsForProfile(quizRow.id, 3)
    : [];

  const allQuizzes = await Promise.all(
    allQuizRows.map(async (row) => ({
      lessonId: row.lessonId,
      attempts: await findQuizAttemptsForProfile(row.id, 1),
    })),
  );

  const weakFromAttempts = new Set<string>();
  for (const attempt of quizAttempts) {
    for (const c of attempt.weakConcepts) {
      weakFromAttempts.add(c);
    }
  }

  const latestAttempt = quizAttempts[0];
  const recentQuizScore =
    latestAttempt
      ? `${latestAttempt.score}/${latestAttempt.total}`
      : null;
  const recentQuizPercent =
    latestAttempt
      ? Math.round((latestAttempt.score / latestAttempt.total) * 100)
      : null;

  const strongConcepts: string[] = [];
  const weakConcepts = [...weakFromAttempts];

  if (lesson && recentQuizPercent !== null) {
    if (recentQuizPercent >= 70) {
      strongConcepts.push(...lesson.concepts.slice(0, 3));
    } else if (recentQuizPercent < 50 && lesson.concepts.length > 0) {
      weakConcepts.push(...lesson.concepts.slice(-2));
    }
  }

  if (node && weakConcepts.length === 0 && recentQuizPercent !== null && recentQuizPercent < 60) {
    weakConcepts.push(node.conceptChain[node.conceptChain.length - 1]);
  }

  const noteTopics = notes
    .map((n) => n.title.trim())
    .filter(Boolean)
    .slice(0, 4);

  const recentChatTopics = sessions
    .flatMap((s) =>
      s.messages
        .filter((m) => m.role === "user")
        .map((m) => m.content.slice(0, 80)),
    )
    .slice(0, 3);

  const crossLessonStrong: string[] = [];
  const crossLessonWeak: string[] = [];

  for (const q of allQuizzes) {
    const l = getLessonById(q.lessonId);
    const attempt = q.attempts[0];
    if (!attempt || !l) continue;
    const pct = (attempt.score / attempt.total) * 100;
    if (pct >= 75) crossLessonStrong.push(l.title);
    if (pct < 50) {
      crossLessonWeak.push(l.title);
      for (const c of attempt.weakConcepts) crossLessonWeak.push(c);
    }
  }

  return {
    strongConcepts: [...new Set(strongConcepts)].slice(0, 5),
    weakConcepts: [...new Set(weakConcepts)].slice(0, 6),
    recentQuizScore,
    recentQuizPercent,
    noteTopics,
    chatSessionCount: sessions.length,
    recentChatTopics,
    interviewCompleted: false,
    crossLessonStrong: [...new Set(crossLessonStrong)].slice(0, 4),
    crossLessonWeak: [...new Set(crossLessonWeak)].slice(0, 6),
  };
}

export function formatLearnerProfile(profile: LearnerProfile): string {
  const lines: string[] = ["Learner profile for this lesson:"];

  if (profile.crossLessonStrong.length > 0) {
    lines.push(`Strong (other topics): ${profile.crossLessonStrong.join(", ")}`);
  }
  if (profile.strongConcepts.length > 0) {
    lines.push(`Strong: ${profile.strongConcepts.join(", ")}`);
  }
  if (profile.weakConcepts.length > 0) {
    lines.push(`Needs improvement: ${profile.weakConcepts.join(", ")}`);
  }
  if (profile.recentQuizScore) {
    lines.push(`Recent quiz: ${profile.recentQuizScore}`);
  }
  if (profile.noteTopics.length > 0) {
    lines.push(`Notes on: ${profile.noteTopics.join(", ")}`);
  }
  if (profile.recentChatTopics.length > 0) {
    lines.push(
      `Recent questions asked: ${profile.recentChatTopics.join(" | ")}`,
    );
  }
  if (profile.chatSessionCount > 0) {
    lines.push(`Chat sessions on this lesson: ${profile.chatSessionCount}`);
  }

  if (lines.length === 1) {
    lines.push("New learner — no prior activity on this lesson yet.");
  }

  lines.push("Adapt teaching depth and focus based on this profile.");

  return lines.join("\n");
}
