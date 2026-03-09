// In-memory vector store — no database needed
type Chunk = {
  text: string;
  embedding: number[];
  lessonId: string;
};

// Global store persists across requests in development
const store: Chunk[] = [];

export function addChunks(chunks: Chunk[]) {
  // Remove existing chunks for this lesson before adding new ones
  const lessonId = chunks[0]?.lessonId;
  const filtered = store.filter((c) => c.lessonId !== lessonId);
  store.length = 0;
  store.push(...filtered, ...chunks);
}

export function getChunks(lessonId: string): Chunk[] {
  return store.filter((c) => c.lessonId === lessonId);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

export function getTopChunks(
  queryEmbedding: number[],
  lessonId: string,
  topK = 3,
): string[] {
  const chunks = getChunks(lessonId);
  if (chunks.length === 0) return [];

  return chunks
    .map((chunk) => ({
      text: chunk.text,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((c) => c.text);
}
