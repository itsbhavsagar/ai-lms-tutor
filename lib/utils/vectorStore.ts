/**
 * Vector Store & Similarity Search
 * Cosine similarity for RAG chunk retrieval
 */

export type EmbeddingVector = number[];

/**
 * Calculate cosine similarity between two embeddings
 * Range: -1 to 1, where 1 is identical
 */
export function cosineSimilarity(
  a: EmbeddingVector,
  b: EmbeddingVector,
): number {
  if (a.length !== b.length) {
    throw new Error("Embeddings must have same dimension");
  }

  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magA === 0 || magB === 0) {
    return 0; // Handle zero vectors
  }

  return dot / (magA * magB);
}

/**
 * Find top K most similar items by embedding
 */
export interface ScoredItem<T> {
  item: T;
  score: number;
}

export function findTopK<T extends { embedding: EmbeddingVector }>(
  queryEmbedding: EmbeddingVector,
  items: T[],
  k: number = 5,
  minScore: number = 0,
): ScoredItem<T>[] {
  if (items.length === 0) return [];

  const scored = items
    .map((item) => ({
      item,
      score: cosineSimilarity(queryEmbedding, item.embedding),
    }))
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return scored;
}

/**
 * Normalize embedding vector to unit length
 * Improves consistency for similarity calculations
 */
export function normalizeEmbedding(
  embedding: EmbeddingVector,
): EmbeddingVector {
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0),
  );

  if (magnitude === 0) return embedding;

  return embedding.map((val) => val / magnitude);
}

/**
 * Batch normalize embeddings
 */
export function normalizeEmbeddings(
  embeddings: EmbeddingVector[],
): EmbeddingVector[] {
  return embeddings.map(normalizeEmbedding);
}
