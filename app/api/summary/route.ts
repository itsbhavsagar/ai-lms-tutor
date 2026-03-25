import Groq from "groq-sdk";
import { prisma } from "@/lib/db/prisma";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
          content: `You are an expert educator. Return ONLY valid JSON. No markdown, no backticks.
        
        Format:
        {
          "overview": "2-3 sentence overview of the lesson",
          "keyPoints": ["point 1", "point 2", "point 3", "point 4"],
          "remember": "The single most important thing to remember"
        }`,
        },
        {
          role: "user",
          content: `Summarize this lesson about ${lessonTitle}:\n\n${lessonContent}`,
        },
      ],
    });

    const raw = response.choices[0].message.content || "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const summaryData = JSON.parse(cleaned);

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: `${userId}@temp.local` },
    });

    const summary = await prisma.summary.create({
      data: {
        userId,
        lessonId,
        summaryText: JSON.stringify(summaryData),
      },
    });

    console.log(`[Summary] Created summary: ${summary.id}`);

    return Response.json(summaryData);
  } catch (error) {
    console.error("[Summary] POST error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
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
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}
