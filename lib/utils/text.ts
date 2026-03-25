/**
 * Text Processing Utilities
 * Chunking, cleaning, and preprocessing for RAG
 */

/**
 * Chunk text by paragraph breaks, respecting max chunk size
 * Overlaps between chunks to preserve context
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50,
): string[] {
  if (!text.trim()) return [];

  // Clean and normalize text
  const cleaned = text
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    // Take chunk of desired size
    let end = Math.min(start + chunkSize, cleaned.length);

    // Avoid cutting in middle of word: find last space before end
    if (end < cleaned.length) {
      const lastSpace = cleaned.lastIndexOf(" ", end);
      if (lastSpace > start + chunkSize * 0.75) {
        // If we found a space in last 25% of chunk, use it
        end = lastSpace;
      }
    }

    const chunk = cleaned.substring(start, end).trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move start position, accounting for overlap
    start = end - overlap;

    // Prevent infinite loop
    if (start >= cleaned.length) break;
  }

  return chunks.filter((chunk) => chunk.length > 20); // Filter very small chunks
}

/**
 * Chunk text by semantic boundaries (paragraphs/sentences)
 * Better for structured documents
 */
export function chunkTextSemantic(
  text: string,
  targetChunkSize: number = 500,
  minChunkSize: number = 50,
): string[] {
  const paragraphs = text.split(/\n\n+/); // Split by paragraph
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const cleaned = paragraph
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    if (!cleaned || cleaned.length < minChunkSize) continue;

    // If adding this paragraph would exceed target, save current chunk
    if (
      currentChunk.length > 0 &&
      (currentChunk + " " + cleaned).length > targetChunkSize
    ) {
      if (currentChunk.trim().length >= minChunkSize) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = cleaned;
    } else {
      currentChunk = currentChunk ? currentChunk + "\n\n" + cleaned : cleaned;
    }
  }

  // Don't forget last chunk
  if (currentChunk.trim().length >= minChunkSize) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Estimate token count (rough approximation)
 * 1 token ≈ 4 characters (conservative estimate)
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to stay within token budget
 * Useful for context windows
 */
export function truncateToTokenBudget(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;

  // Try to cut at sentence boundary
  const truncated = text.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastNewline = truncated.lastIndexOf("\n");
  const lastBreak = Math.max(lastPeriod, lastNewline);

  if (lastBreak > maxChars * 0.8) {
    return truncated.substring(0, lastBreak + 1);
  }

  return truncated;
}
