import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { lessonContent, lessonTitle } = await req.json();

  const response = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `You are a quiz generator for an LMS platform.
        Return ONLY a valid JSON array. No explanation, no markdown, no backticks.
        Generate exactly 4 multiple choice questions based on the lesson content.
        
        Format:
        [
          {
            "question": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct": 0
          }
        ]
        
        "correct" is the index (0-3) of the correct option.
        Make questions clear and educational.`,
      },
      {
        role: "user",
        content: `Generate a quiz for this lesson about ${lessonTitle}:\n\n${lessonContent}`,
      },
    ],
  });

  const raw = response.choices[0].message.content || "[]";

  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(cleaned);
    return Response.json({ questions });
  } catch {
    return Response.json({ questions: [] });
  }
}
