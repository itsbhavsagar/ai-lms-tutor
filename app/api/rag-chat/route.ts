import Groq from "groq-sdk";
import { CohereClient } from "cohere-ai";
import { prisma } from "@/lib/db/prisma";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

type Message = { role: "user" | "assistant"; content: string };

function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

export async function POST(req: Request) {
  try {
    const { messages, lessonId, userId } = await req.json();

    if (!messages || !lessonId || !userId) {
      return Response.json(
        { error: "messages, lessonId and userId are required" },
        { status: 400 },
      );
    }

    const lastMessage = messages[messages.length - 1]?.content;

    const queryEmbedding = await cohere.embed({
      texts: [lastMessage],
      model: "embed-english-v3.0",
      inputType: "search_query",
    });

    const queryVector = (queryEmbedding.embeddings as number[][])[0];

    const chunks = await prisma.chunk.findMany({
      where: {
        document: {
          lessonId,
          userId,
        },
      },
    });

    const scored = chunks.map((chunk) => ({
      text: chunk.text,
      score: cosineSimilarity(queryVector, chunk.embedding),
    }));

    const topChunks = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((c) => c.text);

    const context =
      topChunks.length > 0
        ? topChunks.join("\n\n")
        : "No relevant content found.";

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      stream: true,
      messages: [
        {
          role: "system",
          content: `You are a helpful tutor. Answer ONLY using the context below.


If the answer is not present, say you don't have enough information.

Context:
"""${context}"""`,
        },
        ...messages,
      ],
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const text = chunk.choices?.[0]?.delta?.content || "";
          controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("RAG error:", error);

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Internal error",
      },
      { status: 500 },
    );
  }
}
