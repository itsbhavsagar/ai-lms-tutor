import { CohereClient } from "cohere-ai";
import { addChunks } from "@/app/lib/vectorStore";

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

    if (!file) return Response.json({ error: "No file" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const text = await extractTextFromPDF(buffer);

    if (!text.trim()) {
      return Response.json(
        { error: "No text extracted from PDF" },
        { status: 400 },
      );
    }

    const chunks = chunkText(text);

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

    addChunks(
      chunks.map((text, i) => ({
        text,
        embedding: allEmbeddings[i],
        lessonId,
      })),
    );

    return Response.json({
      success: true,
      chunksCreated: chunks.length,
    });
  } catch (error) {
    console.error("PDF upload error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
