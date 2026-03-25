/**
 * RAG Pipeline
 * End-to-end pipeline for document ingestion, embedding, and retrieval
 */

import db from "@/lib/db";
import { chunkTextSemantic } from "@/lib/utils/text";
import { generateEmbeddingsBatch } from "./embeddings";
import { findTopK } from "@/lib/utils/vectorStore";
import { DocumentChunk, RagRetrieval } from "@/lib/db/schema";

/**
 * Configuration for RAG pipeline
 */
export interface RagConfig {
  chunkSize?: number;
  minChunkSize?: number;
  topK?: number; // Number of chunks to retrieve
  minSimilarityScore?: number;
}

const DEFAULT_CONFIG: Required<RagConfig> = {
  chunkSize: 500,
  minChunkSize: 50,
  topK: 5,
  minSimilarityScore: 0.3,
};

/**
 * Ingest a document into RAG system
 * 1. Parse document
 * 2. Chunk text
 * 3. Generate embeddings
 * 4. Store in database
 */
export async function ingestDocument(
  userId: string,
  lessonId: string,
  fileName: string,
  text: string,
  config: RagConfig = {},
): Promise<{ documentId: string; chunksCreated: number }> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // 1. Chunk the text
  const chunks = chunkTextSemantic(
    text,
    finalConfig.chunkSize,
    finalConfig.minChunkSize,
  );

  if (chunks.length === 0) {
    throw new Error("No valid chunks created from document");
  }

  // 2. Generate embeddings for all chunks
  const embeddings = await generateEmbeddingsBatch(
    chunks,
    90, // Batch size for API
    "search_document",
  );

  // 3. Create document chunks with embeddings
  const documentChunks: DocumentChunk[] = chunks.map((text, index) => ({
    id: `chunk_${Date.now()}_${index}`,
    text,
    embedding: embeddings[index],
    chunkIndex: index,
    metadata: {
      pageNumber: Math.floor(index / 5) + 1, // Rough page estimate
    },
  }));

  // 4. Store in database
  const document = await db.createDocument(
    userId,
    lessonId,
    fileName,
    documentChunks,
  );

  return {
    documentId: document.id,
    chunksCreated: documentChunks.length,
  };
}

/**
 * Retrieve relevant chunks for a query
 * Uses semantic similarity to find most relevant chunks
 */
export async function retrieveRelevantChunks(
  query: string,
  userId: string,
  lessonId: string,
  config: RagConfig = {},
): Promise<RagRetrieval[]> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // 1. Get all documents for this lesson + user
  const documents = await db.getDocumentsByLesson(userId, lessonId);

  if (documents.length === 0) {
    return [];
  }

  // 2. Generate embedding for query
  const { generateEmbedding } = await import("./embeddings");
  const queryEmbedding = await generateEmbedding(query, "search_query");

  // 3. Collect all chunks from all documents
  interface ChunkWithSource extends DocumentChunk {
    source: string;
  }

  const allChunks: ChunkWithSource[] = documents.flatMap((doc) =>
    doc.chunks.map((chunk) => ({
      ...chunk,
      source: doc.fileName,
    })),
  );

  // 4. Find top K similar chunks
  const topChunks = findTopK(
    queryEmbedding,
    allChunks,
    finalConfig.topK,
    finalConfig.minSimilarityScore,
  );

  // 5. Build retrieval results
  return topChunks.map((scored) => ({
    chunkText: scored.item.text,
    score: scored.score,
    source: scored.item.source,
  }));
}

/**
 * Format retrieved chunks into context string for prompt
 */
export function formatRetrievedContext(retrievals: RagRetrieval[]): string {
  if (retrievals.length === 0) {
    return "";
  }

  const context = retrievals
    .map(
      (r, i) =>
        `[Source: ${r.source} - Relevance: ${(r.score * 100).toFixed(0)}%]\n${r.chunkText}`,
    )
    .join("\n\n---\n\n");

  return `Here is relevant context from your documents:\n\n${context}`;
}
