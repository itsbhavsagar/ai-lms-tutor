import { CohereClient } from "cohere-ai";
import { addChunks } from "@/app/lib/vectorStore";

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
  const { text, lessonId } = await req.json();

  const chunks = chunkText(text);

  const response = await cohere.embed({
    texts: chunks,
    model: "embed-english-v3.0",
    inputType: "search_document",
  });

  const embeddings = response.embeddings as number[][];

  addChunks(
    chunks.map((text, i) => ({
      text,
      embedding: embeddings[i],
      lessonId,
    })),
  );

  return Response.json({ success: true, chunksCreated: chunks.length });
}
