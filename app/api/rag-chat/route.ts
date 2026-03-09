import Groq from "groq-sdk";
import { CohereClient } from "cohere-ai";
import { getTopChunks } from "@/app/lib/vectorStore";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

type Message = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const { messages, lessonId } = await req.json();
  const lastMessage = messages[messages.length - 1].content;

  // Embed the user's question
  const queryEmbedding = await cohere.embed({
    texts: [lastMessage],
    model: "embed-english-v3.0",
    inputType: "search_query",
  });

  const queryVector = (queryEmbedding.embeddings as number[][])[0];

  // Retrieve top 3 relevant chunks
  const relevantChunks = getTopChunks(queryVector, lessonId, 3);

  const context =
    relevantChunks.length > 0
      ? relevantChunks.join("\n\n")
      : "No relevant content found.";

  // Generate answer using only retrieved context
  const stream = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    stream: true,
    messages: [
      {
        role: "system",
        content: `You are a helpful tutor. Answer the student's question using ONLY the context below.
        If the answer is not in the context, say you don't have enough information on that topic.
        
        Context:
        """${context}"""`,
      },
      ...(messages as Message[]),
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
