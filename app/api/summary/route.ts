import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { lessonContent, lessonTitle } = await req.json();

  const response = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `You are an expert educator. Return ONLY valid JSON. No markdown, no backticks.
        
        Format:
        {
          "overview": "2-3 sentence overview of the lesson",
          "keyPoints": ["point 1", "point 2", "point 3", "point 4"],
          "remember": "The single most important thing to remember"
        }`,
      },
      {
        role: "user",
        content: `Summarize this lesson about ${lessonTitle}:\n\n${lessonContent}`,
      },
    ],
  });

  const raw = response.choices[0].message.content || "{}";
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return Response.json(JSON.parse(cleaned));
  } catch {
    return Response.json({ overview: "", keyPoints: [], remember: "" });
  }
}
