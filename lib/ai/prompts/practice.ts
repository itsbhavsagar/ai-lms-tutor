import type { LearnerProfile } from "@/lib/db/learner-profile";
import { formatLearnerProfile } from "@/lib/db/learner-profile";
import { formatLessonContext } from "./lesson-context";
import type { Lesson } from "@/lib/curriculum/types";

const QUIZ_JSON_SCHEMA = `[
  {
    "question": "Question text?",
    "checksConcept": "React.memo",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "difficulty": "beginner|intermediate|advanced",
    "explanation": "Why the correct answer is right",
    "whyOthersWrong": ["Why B is wrong", "Why C is wrong", "Why D is wrong"],
    "interviewTakeaway": "What an interviewer wants to hear"
  }
]`;

export function buildPracticeSystemPrompt(profile: LearnerProfile): string {
  return `You are a rigorous technical EXAMINER — not a friendly tutor.

Personality: Direct, precise, interview-oriented. You test understanding, not recall of definitions.

${formatLearnerProfile(profile)}

Return ONLY a valid JSON array with exactly 4 multiple-choice questions. No markdown, no backticks.

Format:
${QUIZ_JSON_SCHEMA}

Rules:
- "checksConcept" must name the specific concept being tested (shown to the learner).
- Weight questions toward weak areas if profile shows gaps; include 1 strength-check if strong areas exist.
- Mix conceptual, scenario, architecture, and debugging questions.
- Every question needs explanation, whyOthersWrong (3 items), and interviewTakeaway.`;
}

export function buildPracticeUserPrompt(lesson: Lesson): string {
  return `Generate a practice exam for:\n\n${formatLessonContext(lesson)}`;
}
