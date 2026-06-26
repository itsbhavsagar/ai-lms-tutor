import type { Lesson } from "@/lib/curriculum/types";

type LessonSuggestion = {
  label: string;
  prompt: string;
};

export function getSuggestedQuestions(lesson: Lesson): LessonSuggestion[] {
  const concept = lesson.concepts[0] ?? lesson.title;
  const interview = lesson.interviewFocus[0] ?? concept;
  const production = lesson.productionTopics[0] ?? concept;

  return [
    {
      label: "Quick quiz",
      prompt: `Quiz me on ${concept} with a scenario and A/B/C options`,
    },
    {
      label: "Production example",
      prompt: `Brief production example of ${production} — 2-3 sentences, no code, one real-world insight`,
    },
    {
      label: "Interview question",
      prompt: `Ask me an interview question about ${interview}`,
    },
    {
      label: "60-second summary",
      prompt: `Give me a 60-second summary of ${lesson.title}`,
    },
  ];
}
