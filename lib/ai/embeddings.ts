import { CohereClient } from "cohere-ai";

const client = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

export type EmbeddingVector = number[];

export async function generateEmbeddings(
  texts: string[],
  inputType: "search_document" | "search_query" = "search_document",
): Promise<EmbeddingVector[]> {
  if (texts.length === 0) return [];

  if (texts.length > 100) {
    const results: EmbeddingVector[] = [];
    for (let i = 0; i < texts.length; i += 100) {
      const batch = texts.slice(i, i + 100);
      const batchEmbeddings = await generateEmbeddings(batch, inputType);
      results.push(...batchEmbeddings);
    }
    return results;
  }

  try {
    const response = await client.embed({
      texts,
      model: "embed-english-v3.0",
      inputType,
    });

    return response.embeddings as EmbeddingVector[];
  } catch (error) {
    throw new Error(
      `Failed to generate embeddings: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function generateEmbedding(
  text: string,
  inputType: "search_document" | "search_query" = "search_document",
): Promise<EmbeddingVector> {
  const embeddings = await generateEmbeddings([text], inputType);
  return embeddings[0];
}

export async function generateEmbeddingsBatch(
  texts: string[],
  batchSize: number = 90,
  inputType: "search_document" | "search_query" = "search_document",
): Promise<EmbeddingVector[]> {
  const results: EmbeddingVector[] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, Math.min(i + batchSize, texts.length));
    const batchEmbeddings = await generateEmbeddings(batch, inputType);
    results.push(...batchEmbeddings);

    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}
