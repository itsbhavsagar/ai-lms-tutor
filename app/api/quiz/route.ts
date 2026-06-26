import Groq from "groq-sdk";
import { parseJsonFromModel } from "@/lib/ai/parse-json";
import {
  buildPracticeSystemPrompt,
  buildPracticeUserPrompt,
} from "@/lib/ai/prompts/practice";
import { getLessonById } from "@/lib/curriculum";
import { buildLearnerProfileSafe } from "@/lib/db/learner-profile";
import { findLatestQuizWithAttempts } from "@/lib/db/quiz-attempt";
import { prisma } from "@/lib/db/prisma";
import { jsonApiError } from "@/lib/utils/apiError";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

    const quiz = await findLatestQuizWithAttempts(userId, lessonId);

    if (!quiz) {
      return Response.json({ quiz: null, attempts: [] });
    }

    const questions = JSON.parse(quiz.questions as string) as unknown[];
    return Response.json({
      quiz: { ...quiz, questions },
      attempts: quiz.attempts,
    });
  } catch (error) {
    console.error("[Quiz] GET error:", error);
    return jsonApiError(error, "Failed to load quiz");
  }
}

export async function POST(req: Request) {
  try {
    const { userId, lessonId } = await req.json();

    if (!userId || !lessonId) {
      return Response.json(
        { error: "userId and lessonId are required" },
        { status: 400 },
      );
    }

    const lesson = getLessonById(lessonId);
    if (!lesson) {
      return Response.json({ error: "Lesson not found" }, { status: 404 });
    }

    const profile = await buildLearnerProfileSafe(userId, lessonId);

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: buildPracticeSystemPrompt(profile) },
        { role: "user", content: buildPracticeUserPrompt(lesson) },
      ],
    });

    const raw = response.choices[0].message.content || "[]";
    const questions = parseJsonFromModel(raw, []);

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: `${userId}@temp.local` },
    });

    await prisma.quiz.create({
      data: {
        userId,
        lessonId,
        questions: JSON.stringify(questions),
      },
    });

    return Response.json({ questions });
  } catch (error) {
    console.error("[Quiz] POST error:", error);
    return jsonApiError(error, "Failed to generate quiz");
  }
}
