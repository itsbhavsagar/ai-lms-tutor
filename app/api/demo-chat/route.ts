import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

type Message = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    stream: true,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful AI assistant. Answer any question the user asks clearly, accurately and helpfully.",
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
