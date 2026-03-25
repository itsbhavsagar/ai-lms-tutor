/**
 * PDF Upload & RAG Ingestion API
 * POST /api/upload-pdf
 *
 * Accepts multipart FormData:
 * - file: File (PDF)
 * - userId: string
 * - lessonId: string
 *
 * Returns: { documentId, chunksCreated }
 */

import { extractTextFromPDF } from "@/lib/utils/pdf";
import { validatePdfUpload } from "@/lib/utils/validation";
import { ingestDocument } from "@/lib/ai/rag";
import {
  RATE_LIMITS,
  createRateLimitResponse,
} from "@/lib/middleware/rateLimit";

export async function POST(req: Request) {
  try {
    // 1. Apply rate limiting (stricter for uploads)
    const rateLimitResult = RATE_LIMITS.upload(req);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(
        rateLimitResult.remaining,
        rateLimitResult.resetTime,
      );
    }

    // 2. Parse and validate form data
    const formData = await req.formData();
    const { file, userId, lessonId } = validatePdfUpload(formData);

    // 3. Extract text from PDF
    const buffer = await file.arrayBuffer();
    const text = await extractTextFromPDF(buffer);

    // 4. Ingest document into RAG system
    const { documentId, chunksCreated } = await ingestDocument(
      userId,
      lessonId,
      file.name,
      text,
      {
        chunkSize: 500,
        minChunkSize: 50,
      },
    );

    // 5. Return success response
    return Response.json(
      {
        success: true,
        documentId,
        chunksCreated,
        message: `Successfully ingested ${chunksCreated} chunks from ${file.name}`,
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        },
      },
    );
  } catch (error) {
    console.error("PDF upload error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to process PDF";
    const status = message.includes(
      "ValidationError" | "must be" | "must be less",
    )
      ? 400
      : 500;

    return Response.json(
      {
        error: message,
      },
      {
        status,
      },
    );
  }
}
