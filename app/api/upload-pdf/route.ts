import { CohereClient } from "cohere-ai";
import { prisma } from "@/lib/db/prisma";

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

function chunkText(text: string, chunkSize = 300): string[] {
  const paragraphs = text.split(/\n+/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const cleaned = para.replace(/\s+/g, " ").trim();
    if (!cleaned || cleaned.length < 20) continue;

    if ((current + cleaned).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = cleaned;
    } else {
      current += " " + cleaned;
    }
  }
  if (current.trim().length > 20) chunks.push(current.trim());
  return chunks;
}

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const PDFParser = require("pdf2json");
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (err: any) => {
      reject(err.parserError);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      const text = pdfData.Pages.map((page: any) =>
        page.Texts.map((t: any) =>
          decodeURIComponent(t.R.map((r: any) => r.T).join("")),
        ).join(" "),
      ).join("\n\n");
      resolve(text);
    });

    pdfParser.parseBuffer(Buffer.from(buffer));
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const lessonId = formData.get("lessonId") as string;
    const userId = formData.get("userId") as string;

    if (!file) return Response.json({ error: "No file" }, { status: 400 });
    if (!lessonId)
      return Response.json({ error: "No lessonId" }, { status: 400 });
    if (!userId) return Response.json({ error: "No userId" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const text = await extractTextFromPDF(buffer);

    if (!text.trim()) {
      return Response.json(
        { error: "No text extracted from PDF" },
        { status: 400 },
      );
    }

    const chunks = chunkText(text);
    console.log(`[RAG] Processing ${chunks.length} chunks from ${file.name}`);

    const batchSize = 90;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const response = await cohere.embed({
        texts: batch,
        model: "embed-english-v3.0",
        inputType: "search_document",
      });
      allEmbeddings.push(...(response.embeddings as number[][]));
    }

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
        title: file.name,
      },
    });

    console.log(`[RAG] Document created: ${document.id}`);

    await prisma.chunk.createMany({
      data: chunks.map((text, i) => ({
        documentId: document.id,
        text,
        embedding: allEmbeddings[i],
      })),
    });

    console.log(
      `[RAG] Created ${chunks.length} chunks for document ${document.id}`,
    );

    return Response.json({
      success: true,
      chunksCreated: chunks.length,
      documentId: document.id,
      pages: Math.ceil(chunks.length / 5),
    });
  } catch (error) {
    console.error("[RAG] PDF upload error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
