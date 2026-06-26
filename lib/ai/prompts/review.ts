import type { LearnerProfile } from "@/lib/db/learner-profile";
import { formatLearnerProfile } from "@/lib/db/learner-profile";
import { formatLessonContext } from "./lesson-context";
import type { Lesson } from "@/lib/curriculum/types";
import { getGraphRevisionHint } from "@/lib/learning/recommendations";

export const REVIEW_JSON_SCHEMA = `{
  "understood": ["concept the learner likely grasps"],
  "struggled": ["concept they missed or need work on"],
  "suggestedRevision": "specific topic to revisit",
  "revisionMinutes": 5,
  "commonInterviewMistake": "one mistake interviewers see often on this topic",
  "productionExample": "one concise real-world production example",
  "mentorNote": "1-2 sentences of personalized encouragement or direction"
}`;

export function buildReviewSystemPrompt(profile: LearnerProfile): string {
  return `You are a seasoned engineering MENTOR creating a personalized review — not a generic summary.

Personality: Honest, supportive, specific. Speak directly to this learner's gaps.

${formatLearnerProfile(profile)}

Return ONLY valid JSON. No markdown, no backticks:
${REVIEW_JSON_SCHEMA}

Rules:
- "understood" and "struggled" must reflect quiz score and weak concepts from the profile — be specific, not generic.
- If quiz was weak, struggled should name exact concepts. If strong, understood should reflect that.
- suggestedRevision targets the biggest gap; revisionMinutes realistic (3-10).
- productionExample must be concrete (company scenario, scale, tradeoff).`;
}

export function buildReviewUserPrompt(
  lesson: Lesson,
  profile: LearnerProfile,
): string {
  const weak = profile.weakConcepts[0];
  const graphHint = weak ? getGraphRevisionHint(lesson.id, weak) : null;

  let prompt = `Create a personalized review for:\n\n${formatLessonContext(lesson)}`;
  if (graphHint) {
    prompt += `\n\nKnowledge graph hint: ${graphHint}`;
  }
  return prompt;
}
