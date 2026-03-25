export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50,
): string[] {
  if (!text.trim()) return [];

  const cleaned = text.replace(/\s+/g, " ").trim();

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + chunkSize, cleaned.length);

    if (end < cleaned.length) {
      const lastSpace = cleaned.lastIndexOf(" ", end);
      if (lastSpace > start + chunkSize * 0.75) {
        end = lastSpace;
      }
    }

    const chunk = cleaned.substring(start, end).trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    start = end - overlap;

    if (start >= cleaned.length) break;
  }

  return chunks.filter((chunk) => chunk.length > 20);
}

export function chunkTextSemantic(
  text: string,
  targetChunkSize: number = 500,
  minChunkSize: number = 50,
): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const cleaned = paragraph.replace(/\s+/g, " ").trim();

    if (!cleaned || cleaned.length < minChunkSize) continue;

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

  if (currentChunk.trim().length >= minChunkSize) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

export function truncateToTokenBudget(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;

  const truncated = text.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastNewline = truncated.lastIndexOf("\n");
  const lastBreak = Math.max(lastPeriod, lastNewline);

  if (lastBreak > maxChars * 0.8) {
    return truncated.substring(0, lastBreak + 1);
  }

  return truncated;
}
