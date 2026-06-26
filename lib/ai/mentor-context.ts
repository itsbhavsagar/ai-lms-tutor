import type { Lesson } from "@/lib/curriculum/types";

export type MentorSessionContext = {
  consecutiveOffTopicCount: number;
  currentMessageOffTopic: boolean;
};

const LEARNING_INTENT =
  /\b(explain|teach|help|why|how|what(?:'s| is| are)|difference|when should|compare|example|practice|quiz|interview|understand|confused|clarify|walk me through|show me|summarize|define|describe|tradeoff|implement|debug|optimize|best practice|server component|client component)\b/i;

const OFF_TOPIC_TRIGGERS =
  /\b(who is|who was|who are|tell me about (?!how|why|when|the difference)|what happened to|celebrity|movie|actor|president|prime minister|cricket|football|weather|recipe)\b/i;

const CONTINUATION =
  /^(hi|hello|hey|thanks|thank you|ok|okay|yes|no|sure|got it|makes sense|i see|continue|go on|next|[A-Da-d][\).:\s]?$|option [a-d]|\d[\).:])/i;

const RE_ENGAGEMENT_CHOICE =
  /\b(visual explanation|production example|interview question|60.?second summary|60 second summary)\b/i;

function extractLessonKeywords(lesson: Lesson): string[] {
  const raw = [
    lesson.title,
    ...lesson.concepts,
    ...lesson.objectives,
    ...lesson.tags,
    ...lesson.interviewFocus,
    ...lesson.productionTopics,
    ...lesson.prerequisites,
  ];

  const words = new Set<string>();
  for (const text of raw) {
    const lower = text.toLowerCase();
    words.add(lower);
    lower.split(/[\s\-_/.,;:()]+/).forEach((w) => {
      if (w.length > 2) words.add(w);
    });
  }
  return [...words];
}

export function isLikelyOnTopic(message: string, lesson: Lesson): boolean {
  const trimmed = message.trim();
  if (!trimmed) return true;

  const lower = trimmed.toLowerCase();
  const keywords = extractLessonKeywords(lesson);

  if (lower.includes(lesson.title.toLowerCase())) return true;
  if (RE_ENGAGEMENT_CHOICE.test(trimmed)) return true;
  if (CONTINUATION.test(trimmed)) return true;
  if (/^[A-Da-d]$/.test(trimmed)) return true;

  const keywordHits = keywords.filter(
    (k) => k.length > 3 && lower.includes(k),
  );

  if (keywordHits.length >= 2) return true;
  if (keywordHits.length >= 1 && LEARNING_INTENT.test(trimmed)) return true;

  if (OFF_TOPIC_TRIGGERS.test(trimmed) && keywordHits.length === 0) {
    return false;
  }

  if (/^\s*who (?:is|was|are)\b/i.test(trimmed) && keywordHits.length === 0) {
    return false;
  }

  if (
    trimmed.length < 80 &&
    /^(who|what|when|where)\s+(is|was|are)\s+/i.test(trimmed) &&
    keywordHits.length === 0 &&
    !LEARNING_INTENT.test(trimmed)
  ) {
    return false;
  }

  if (keywordHits.length >= 1) return true;
  if (LEARNING_INTENT.test(trimmed)) return true;

  return true;
}

function countConsecutiveOffTopic(
  userMessages: string[],
  lesson: Lesson,
): number {
  let count = 0;
  for (let i = userMessages.length - 1; i >= 0; i--) {
    if (!isLikelyOnTopic(userMessages[i], lesson)) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

export function buildMentorSessionContext(
  priorUserMessages: string[],
  currentMessage: string,
  lesson: Lesson,
): MentorSessionContext {
  const currentMessageOffTopic = !isLikelyOnTopic(currentMessage, lesson);
  const priorStreak = countConsecutiveOffTopic(priorUserMessages, lesson);
  const consecutiveOffTopicCount = currentMessageOffTopic
    ? priorStreak + 1
    : priorStreak;

  return { consecutiveOffTopicCount, currentMessageOffTopic };
}
