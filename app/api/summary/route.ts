import Groq from "groq-sdk";
import { parseJsonFromModel } from "@/lib/ai/parse-json";
import {
  buildReviewSystemPrompt,
  buildReviewUserPrompt,
} from "@/lib/ai/prompts/review";
import { getLessonById } from "@/lib/curriculum";
import { buildLearnerProfileSafe } from "@/lib/db/learner-profile";
import { prisma } from "@/lib/db/prisma";
import { jsonApiError } from "@/lib/utils/apiError";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const EMPTY_REVIEW = {
  understood: [],
  struggled: [],
  suggestedRevision: "",
  revisionMinutes: 5,
  commonInterviewMistake: "",
  productionExample: "",
  mentorNote: "",
};

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
        { role: "system", content: buildReviewSystemPrompt(profile) },
        { role: "user", content: buildReviewUserPrompt(lesson, profile) },
      ],
    });

    const raw = response.choices[0].message.content || "{}";
    const reviewData = parseJsonFromModel(raw, EMPTY_REVIEW);

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: `${userId}@temp.local` },
    });

    await prisma.summary.create({
      data: {
        userId,
        lessonId,
        summaryText: JSON.stringify(reviewData),
      },
    });

    return Response.json(reviewData);
  } catch (error) {
    console.error("[Summary] POST error:", error);
    return jsonApiError(error, "Failed to generate summary");
  }
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

    const summary = await prisma.summary.findFirst({
      where: {
        userId,
        lessonId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!summary) {
      return Response.json({ summary: null });
    }

    const summaryData = JSON.parse(summary.summaryText);
    return Response.json({ summary: summaryData });
  } catch (error) {
    console.error("[Summary] GET error:", error);
    return jsonApiError(error, "Failed to load summary");
  }
}
