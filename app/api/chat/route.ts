import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { messages, lessonContent } = await req.json();

  const stream = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    stream: true,
    messages: [
      {
        role: "system",
        content: `You are a helpful tutor for an LMS platform.
        Only answer questions based on this lesson content:
        
        """${lessonContent}"""
        
        If the user asks anything outside this content, 
        politely decline and redirect them to the lesson.
        Keep answers concise and clear.`,
      },
      ...messages,
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
