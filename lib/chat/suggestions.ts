import type { Lesson } from "@/lib/curriculum/types";

export function getSuggestedQuestions(lesson: Lesson): string[] {
  const concept = lesson.concepts[0] ?? lesson.title;
  const interview = lesson.interviewFocus[0] ?? concept;
  const production = lesson.productionTopics[0];

  return [
    `Quiz me on ${concept} with a scenario and A/B/C options`,
    `Give me a production example of ${production ?? concept}`,
    `Ask me an interview question about ${interview}`,
    `Give me a 60-second summary of ${lesson.title}`,
  ];
}
