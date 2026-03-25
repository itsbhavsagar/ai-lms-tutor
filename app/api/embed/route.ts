import { CohereClient } from "cohere-ai";
import { prisma } from "@/lib/db/prisma";

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

function chunkText(text: string, chunkSize = 200): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += " " + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export async function POST(req: Request) {
  try {
    const { text, lessonId, userId } = await req.json();

    if (!text)
      return Response.json({ error: "No text provided" }, { status: 400 });
    if (!lessonId)
      return Response.json({ error: "No lessonId" }, { status: 400 });
    if (!userId) return Response.json({ error: "No userId" }, { status: 400 });

    const chunks = chunkText(text);
    console.log(`[RAG] Processing ${chunks.length} chunks from pasted text`);

    const response = await cohere.embed({
      texts: chunks,
      model: "embed-english-v3.0",
      inputType: "search_document",
    });

    const embeddings = response.embeddings as number[][];

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: `${userId}@temp.local` },
    });

    await prisma.document.deleteMany({
      where: { userId, lessonId },
    });

    const document = await prisma.document.create({
      data: {
        userId,
        lessonId,
        title: `Pasted content - ${new Date().toISOString()}`,
      },
    });

    console.log(`[RAG] Document created: ${document.id}`);

    await prisma.chunk.createMany({
      data: chunks.map((text, i) => ({
        documentId: document.id,
        text,
        embedding: embeddings[i],
      })),
    });

    console.log(
      `[RAG] Created ${chunks.length} chunks for document ${document.id}`,
    );

    return Response.json({
      success: true,
      chunksCreated: chunks.length,
      documentId: document.id,
    });
  } catch (error) {
    console.error("[RAG] Text embed error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
