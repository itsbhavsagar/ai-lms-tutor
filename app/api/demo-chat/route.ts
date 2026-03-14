import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

type Message = {
  role: "user" | "assistant";
  content: string;
};

const MAX_HISTORY = 4;
const MAX_CHARS = 2000;

function sanitizeMessages(messages: any[]): Message[] {
  return messages
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_CHARS),
    }));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.messages || !Array.isArray(body.messages)) {
      return new Response("Invalid payload", { status: 400 });
    }

    const cleanMessages = sanitizeMessages(body.messages);
    const recentMessages = cleanMessages.slice(-MAX_HISTORY);

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      stream: true,
      temperature: 0.3,
      max_tokens: 180,
      top_p: 0.9,

      messages: [
        {
          role: "system",
          content: `
You are a concise AI assistant.

Rules:
- Answer briefly
- Prefer bullet points
- Maximum 4–5 points
- Each point under 20 words
- Avoid long explanations
- No essays
- If question is simple, answer in one sentence
`,
        },
        ...recentMessages,
      ],
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices?.[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("API error:", err);
    return new Response("Server error", { status: 500 });
  }
}
