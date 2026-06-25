import type { Lesson } from "@/app/data/lessons";

export function getSuggestedQuestions(lesson: Lesson): string[] {
  const topic = lesson.title.replace(/^[^\w]+/, "").trim();

  return [
    `Explain the key ideas of ${topic} in simple terms`,
    `What are the most important things to remember about ${topic}?`,
    `Give me a quick summary of ${topic}`,
    `Quiz me with 3 questions about ${topic}`,
  ];
}
