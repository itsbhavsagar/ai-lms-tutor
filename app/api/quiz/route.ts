import Groq from "groq-sdk";
import { prisma } from "@/lib/db/prisma";

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

    const quiz = await prisma.quiz.findFirst({
      where: {
        userId,
        lessonId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        attempts: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!quiz) {
      return Response.json({ quiz: null, attempts: [] });
    }

    const questions = JSON.parse(quiz.questions as any) as any[];
    return Response.json({
      quiz: { ...quiz, questions },
      attempts: quiz.attempts,
    });
  } catch (error) {
    console.error("[Quiz] GET error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { lessonContent, lessonTitle, userId, lessonId } = await req.json();

    if (!userId || !lessonId) {
      return Response.json(
        { error: "userId and lessonId are required" },
        { status: 400 },
      );
    }

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are a quiz generator for an LMS platform.
        Return ONLY a valid JSON array. No explanation, no markdown, no backticks.
        Generate exactly 4 multiple choice questions based on the lesson content.
        
        Format:
        [
          {
            "question": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct": 0
          }
        ]
        
        "correct" is the index (0-3) of the correct option.
        Make questions clear and educational.`,
        },
        {
          role: "user",
          content: `Generate a quiz for this lesson about ${lessonTitle}:\n\n${lessonContent}`,
        },
      ],
    });

    const raw = response.choices[0].message.content || "[]";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(cleaned);

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: `${userId}@temp.local` },
    });

    const quiz = await prisma.quiz.create({
      data: {
        userId,
        lessonId,
        questions: JSON.stringify(questions),
      },
    });

    console.log(`[Quiz] Created quiz: ${quiz.id}`);

    return Response.json({ questions });
  } catch (error) {
    console.error("[Quiz] POST error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}
