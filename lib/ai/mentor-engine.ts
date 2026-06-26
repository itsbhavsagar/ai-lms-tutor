import type { Lesson } from "@/lib/curriculum/types";
import type { LearnerProfile } from "@/lib/db/learner-profile";
import {
  buildMentorSessionContext,
  isLikelyOnTopic,
  type MentorSessionContext,
} from "@/lib/ai/mentor-context";

export const TEACHING_STRATEGIES = [
  "Explain",
  "Analogy",
  "Scenario",
  "MiniQuiz",
  "Challenge",
  "ProductionStory",
  "DebugExercise",
  "InterviewMode",
  "ReverseQuestion",
  "ThinkFirst",
] as const;

export type TeachingStrategy = (typeof TEACHING_STRATEGIES)[number];

export const MENTOR_MODES = [
  "Coach",
  "SeniorEngineer",
  "Interviewer",
  "Debugger",
] as const;

export type MentorMode = (typeof MENTOR_MODES)[number];

export type ResponseEnding =
  | "teach-only"
  | "socratic-question"
  | "challenge-wait"
  | "mini-quiz"
  | "story-end";

export type MentorTurnPlan = MentorSessionContext & {
  turnIndex: number;
  mode: MentorMode;
  strategy: TeachingStrategy;
  ending: ResponseEnding;
  transition: string;
  confusionDetected: boolean;
  reEngagementRequired: boolean;
  allowHumor: boolean;
  sessionTopics: string[];
};

/** 50+ bridge openers — rotated and deduped against prior assistant turns */
export const TRANSITIONS = [
  "Interesting question.",
  "Speaking of that…",
  "That reminds me of something.",
  "Here's a fun connection.",
  "Let's use that as an example.",
  "Actually, this fits perfectly.",
  "Coincidentally…",
  "Here's how this appears in production.",
  "Let's turn that into an engineering problem.",
  "There's a parallel worth drawing here.",
  "Quick connection before we go deeper.",
  "That maps nicely to something we cover here.",
  "Here's where it gets relevant for engineers.",
  "Worth bridging this to our topic.",
  "Let me connect the dots.",
  "This is more related than it seems.",
  "There's an engineering angle here.",
  "That name comes up in production more than you'd think.",
  "From that world to ours…",
  "Same problem, different domain.",
  "Scale works similarly…",
  "Performance-obsessed teams think the same way.",
  "If you've seen how they operate…",
  "The pattern repeats in frontend too.",
  "Production teams face an identical tradeoff.",
  "Since we're in that industry mentally…",
  "That ecosystem actually runs on…",
  "Real apps in that space…",
  "The engineering reality is…",
  "Strip away the glamour and it's a systems problem.",
  "Under the hood, it's the same constraint.",
  "Latency matters there too — just a different kind.",
  "Millions of users change the math.",
  "High traffic changes how you architect.",
  "That's a textbook case for…",
  "Senior engineers would frame it as…",
  "You'd see this on a Netflix or Flipkart codebase.",
  "BookMyShow engineers solved something similar.",
  "Government sites and streaming apps share…",
  "Both chase milliseconds — one on track, one in the bundle.",
  "Same user expectation: speed.",
  "Here's the production mental model.",
  "What would a staff engineer say?",
  "Let's make this concrete.",
  "Pull up a mental architecture diagram.",
  "Picture the real system.",
  "In a codebase you'd recognize…",
  "This is how it's taught in staff eng reviews.",
  "The tradeoff shows up everywhere.",
  "One hop away from our lesson…",
  "Two concepts linked by scale.",
  "The thread here is performance.",
  "The thread here is rendering at scale.",
  "The thread here is static vs interactive.",
  "Since we're talking about movies…",
  "Since we're talking about scale…",
  "That brand is obsessed with speed.",
  "Here's a bridge most tutorials skip.",
  "Connect this to what we learned earlier.",
];

const OVERUSED_OPENERS = [
  "now, let's imagine",
  "now let's imagine",
  "let's imagine",
  "now imagine",
  "suppose",
  "imagine that",
  "imagine a",
  "imagine an",
  "imagine the",
  "imagine you",
];

const BANNED_PHRASES = [
  "let's get back",
  "let's refocus",
  "we're drifting",
  "we drifted",
  "learning environment",
  "let's continue",
  "i'm here to help",
  "i appreciate",
  "outside today's lesson",
  "park it for later",
  "outside the scope",
  "not related to the lesson",
  "as your tutor",
  "as an ai",
  ...OVERUSED_OPENERS,
];

const CONFUSION_SIGNALS =
  /\b(don't understand|do not understand|confused|what\?|huh|i'm lost|im lost|too hard|explain again|simpler|help me|makes no sense|can you clarify|still unclear)\b/i;

const ENDING_GUIDE: Record<ResponseEnding, string> = {
  "teach-only":
    "Deliver a complete mini-lesson. End on insight — NO question mark at the end. Do NOT ask 'which component' or 'what would you'.",
  "socratic-question":
    "End with ONE sharp question. Keep the teaching portion brief.",
  "challenge-wait":
    "Pose a quick challenge (list items or scenario). Say 'Think before scrolling' or similar. Do NOT reveal the answer.",
  "mini-quiz":
    "End with A/B/C options only. Wait for their pick — do not grade yet unless they already answered.",
  "story-end":
    "End with a production story or war story. No follow-up question — let it land.",
};

const ENDING_CYCLE: ResponseEnding[] = [
  "teach-only",
  "teach-only",
  "story-end",
  "socratic-question",
  "teach-only",
  "challenge-wait",
  "teach-only",
  "story-end",
  "mini-quiz",
  "teach-only",
];

const STRATEGY_GUIDE: Record<TeachingStrategy, string> = {
  Explain:
    "One crisp concept — teach fully. Personality in the opener. No corporate preamble.",
  Analogy:
    "Memorable analogy with a punchy line (e.g. 'We don't optimize lap times—we optimize bundle size.'). Map to the lesson.",
  Scenario:
    "Real product scenario. Only add MCQ if ending requires it.",
  MiniQuiz:
    "Sharp MCQ when ending is mini-quiz. Otherwise embed insight without quizzing.",
  Challenge:
    "Bold edge case. Withhold answer when ending is challenge-wait.",
  ProductionStory:
    "How teams ship this — tradeoff, latency, cost. Can end without a question.",
  DebugExercise:
    "Symptom or short buggy snippet. Ask for root cause only if ending allows.",
  InterviewMode:
    "Probe like an interviewer — but only if ending is socratic-question. Otherwise teach an interview insight without quizzing.",
  ReverseQuestion:
    "Ask what THEY think first — only when ending is challenge-wait or socratic-question.",
  ThinkFirst:
    "Question before explanation — only when ending is challenge-wait.",
};

const MODE_GUIDE: Record<MentorMode, string> = {
  Coach:
    "Confident encourager. Celebrate wins specifically. No corporate warmth.",
  SeniorEngineer:
    "Direct, opinionated, memorable one-liners. Staff engineer at a whiteboard.",
  Interviewer:
    "Probing when asked to question. Otherwise share what interviewers look for.",
  Debugger:
    "Symptoms-first when diagnosing. Otherwise explain failure modes vividly.",
};

function detectConfusion(
  currentMessage: string,
  priorUserMessages: string[],
): boolean {
  if (CONFUSION_SIGNALS.test(currentMessage)) return true;
  return priorUserMessages.slice(-2).some((m) => CONFUSION_SIGNALS.test(m));
}

function pickStrategy(turnIndex: number, offTopic: boolean): TeachingStrategy {
  const bridgeFriendly: TeachingStrategy[] = [
    "ProductionStory",
    "Analogy",
    "Explain",
    "Scenario",
    "ThinkFirst",
  ];
  const pool = offTopic ? bridgeFriendly : [...TEACHING_STRATEGIES];
  return pool[(turnIndex * 3 + 1) % pool.length];
}

function pickMode(
  turnIndex: number,
  profile: LearnerProfile,
  offTopic: boolean,
  confusion: boolean,
): MentorMode {
  if (confusion) return "Coach";
  if (offTopic) return "SeniorEngineer";
  if (
    profile.weakConcepts.length >= 2 ||
    (profile.recentQuizPercent !== null && profile.recentQuizPercent < 55)
  ) {
    return turnIndex % 2 === 0 ? "Coach" : "SeniorEngineer";
  }
  const modes: MentorMode[] = [
    "Coach",
    "SeniorEngineer",
    "Interviewer",
    "Debugger",
  ];
  return modes[(turnIndex + profile.chatSessionCount) % modes.length];
}

function pickEnding(
  turnIndex: number,
  offTopic: boolean,
  strategy: TeachingStrategy,
): ResponseEnding {
  if (strategy === "MiniQuiz") return "mini-quiz";
  if (strategy === "ThinkFirst" || strategy === "ReverseQuestion") {
    return turnIndex % 2 === 0 ? "challenge-wait" : "teach-only";
  }
  if (strategy === "DebugExercise" && turnIndex % 3 === 0) {
    return "challenge-wait";
  }
  if (offTopic) {
    // Most off-topic bridges should teach fully — no forced MCQ
    return turnIndex % 4 === 3 ? "socratic-question" : "teach-only";
  }
  return ENDING_CYCLE[turnIndex % ENDING_CYCLE.length];
}

function pickTransition(
  turnIndex: number,
  priorAssistantMessages: string[],
): string {
  const used = new Set<string>();
  const corpus = priorAssistantMessages.join("\n").toLowerCase();

  for (const t of TRANSITIONS) {
    const needle = t
      .toLowerCase()
      .replace(/[….,!?]/g, "")
      .slice(0, 14)
      .trim();
    if (needle.length >= 8 && corpus.includes(needle)) {
      used.add(t);
    }
  }

  for (const opener of OVERUSED_OPENERS) {
    if (corpus.includes(opener)) {
      used.add(opener);
    }
  }

  let available = TRANSITIONS.filter((t) => !used.has(t));
  if (available.length === 0) available = [...TRANSITIONS];

  return available[(turnIndex * 7 + 3) % available.length];
}

function extractSessionTopics(
  priorUserMessages: string[],
  priorAssistantMessages: string[],
  lesson: Lesson,
): string[] {
  const topics: string[] = [];

  for (const msg of priorUserMessages) {
    const trimmed = msg.trim();
    if (!isLikelyOnTopic(trimmed, lesson)) {
      topics.push(trimmed.length > 50 ? `${trimmed.slice(0, 50)}…` : trimmed);
    }
  }

  const entityPattern =
    /\b(Netflix|Flipkart|Swiggy|BookMyShow|Mission: Impossible|Tom Cruise|Ferrari|Tesla|Modi|Bangalore|Suspense|ISR|Server Components?|Client Components?)\b/gi;
  for (const msg of priorAssistantMessages) {
    for (const match of msg.matchAll(entityPattern)) {
      const value = match[0];
      if (!topics.some((t) => t.toLowerCase() === value.toLowerCase())) {
        topics.push(value);
      }
    }
  }

  return topics.slice(-8);
}

function allowHumorThisTurn(turnIndex: number): boolean {
  if (turnIndex === 0) return false;
  return turnIndex % 17 === 0;
}

export function buildMentorTurnPlan(
  priorUserMessages: string[],
  priorAssistantMessages: string[],
  currentMessage: string,
  lesson: Lesson,
  profile: LearnerProfile,
): MentorTurnPlan {
  const sessionCtx = buildMentorSessionContext(
    priorUserMessages,
    currentMessage,
    lesson,
  );
  const turnIndex = priorUserMessages.length;
  const confusionDetected = detectConfusion(currentMessage, priorUserMessages);
  const reEngagementRequired =
    sessionCtx.currentMessageOffTopic &&
    sessionCtx.consecutiveOffTopicCount >= 4;
  const strategy = pickStrategy(turnIndex, sessionCtx.currentMessageOffTopic);

  return {
    ...sessionCtx,
    turnIndex,
    mode: pickMode(
      turnIndex,
      profile,
      sessionCtx.currentMessageOffTopic,
      confusionDetected,
    ),
    strategy,
    ending: pickEnding(
      turnIndex,
      sessionCtx.currentMessageOffTopic,
      strategy,
    ),
    transition: pickTransition(turnIndex, priorAssistantMessages),
    confusionDetected,
    reEngagementRequired,
    allowHumor: allowHumorThisTurn(turnIndex),
    sessionTopics: extractSessionTopics(
      priorUserMessages,
      priorAssistantMessages,
      lesson,
    ),
  };
}

function formatBridgeGuide(lesson: Lesson): string {
  const concept = lesson.concepts[0] ?? lesson.title;
  return [
    "## Smart bridge (2–3 hops — mandatory for off-topic)",
    "Build a **conceptual chain**. Each hop must follow logically. NEVER jump to unrelated domains.",
    "",
    "BAD: Ferrari → shopping cart",
    `GOOD: Ferrari → millisecond performance obsession → bundle size → ${concept}`,
    "",
    "Hop patterns:",
    "- **Celebrity / movies** → streaming platform (Netflix) → thousands of cards → Server vs Client / Suspense",
    "- **Politics / public figure** → government website → millions of visitors → ISR / static rendering",
    "- **City / place** → local tech (Flipkart, Swiggy) → high-traffic Next.js → edge rendering",
    "- **Car / luxury brand** → performance engineering → frontend perf / bundle splitting",
    "- **Tech company** → live telemetry or dashboards → Client Components for interactivity",
    "",
    `Land on a real ${lesson.title} insight. Teach it fully when ending is teach-only.`,
  ].join("\n");
}

function formatOffTopicInstructions(
  plan: MentorTurnPlan,
  lesson: Lesson,
): string {
  const lines = [
    "## This turn: OFF-TOPIC BRIDGE",
    "Answer what they asked. Bridge intelligently. Teach something valuable.",
    "",
    "Structure:",
    "1. **Personality opener** — one memorable line, not a Wikipedia sentence.",
    '   e.g. "Ferrari builds cars that obsess over milliseconds. Frontend performance is surprisingly similar."',
    "2. **2–3 hop bridge** — see Smart Bridge guide below.",
    `3. **Use this transition opener (do NOT substitute 'imagine' variants):** "${plan.transition}"`,
    `4. **Strategy:** ${plan.strategy} in ${plan.mode} mode.`,
    `5. **Ending:** ${ENDING_GUIDE[plan.ending]}`,
    "",
    "## Gold-standard example (teach-only ending)",
    'User: "Who is Tom Cruise?"',
    'Response: "Tom Cruise is an American actor best known for the Mission: Impossible and Top Gun franchises.',
    "",
    "Since we're talking about movies, here's an engineering problem Netflix actually has to solve:",
    "",
    "The homepage might contain thousands of movie cards. Most of that content comes from the server and doesn't need browser interactivity immediately, so rendering the catalog as **Server Components** keeps the JavaScript bundle smaller and improves initial load performance.",
    "",
    "The interactive parts — search, filters, 'My List', and ratings — become **Client Components**.",
    "",
    'That\'s a real production use of the concept we\'re learning."',
    "(Notice: answered, bridged, taught, NO scolding, NO 'let\'s get back', NO trailing MCQ.)",
    "",
    formatBridgeGuide(lesson),
  ];

  if (plan.reEngagementRequired) {
    lines.push(
      "",
      "They've been distracted repeatedly. After teaching, offer ONCE:",
      "• visual explanation • production example • interview question • 60-second summary",
    );
  }

  return lines.join("\n");
}

function formatOnTopicInstructions(
  plan: MentorTurnPlan,
  lesson: Lesson,
): string {
  if (plan.consecutiveOffTopicCount > 0 && !plan.currentMessageOffTopic) {
    return [
      "## This turn: BACK ON TRACK",
      "Pick up naturally — no mention of drifting.",
      `Strategy: ${plan.strategy} | Ending: ${ENDING_GUIDE[plan.ending]}`,
    ].join("\n");
  }

  return [
    "## This turn: ON-TOPIC",
    `Strategy: ${plan.strategy} in ${plan.mode} mode.`,
    `Ending: ${ENDING_GUIDE[plan.ending]}`,
    plan.confusionDetected
      ? "They seem confused — simplify, one analogy, one concrete example."
      : "If they answered a prior MCQ, grade in one line first.",
    `Do NOT end with a question unless ending is socratic-question, mini-quiz, or challenge-wait.`,
  ].join("\n");
}

function formatSessionMemory(plan: MentorTurnPlan): string {
  if (plan.sessionTopics.length === 0) {
    return "Session memory: (none yet — first conversation)";
  }

  return [
    "Session memory — callback naturally when relevant (don't force it):",
    plan.sessionTopics.map((t) => `- ${t}`).join("\n"),
    "",
    'Example: "Earlier we talked about Netflix. Ferrari gives us another performance example — both obsess over latency…"',
  ].join("\n");
}

function formatHumorRule(plan: MentorTurnPlan): string {
  if (plan.allowHumor) {
    return "Humor: ONE light line allowed this turn (one 😄 max). Make it memorable, then teach.";
  }
  return "Humor: NONE this turn. No emojis (🙈😄😉😊). Stay direct.";
}

export function formatMentorTurnPlan(
  plan: MentorTurnPlan,
  lesson: Lesson,
): string {
  const turnBlock = plan.currentMessageOffTopic
    ? formatOffTopicInstructions(plan, lesson)
    : formatOnTopicInstructions(plan, lesson);

  return [
    "## Mentor Personality Engine (this turn)",
    `Turn #${plan.turnIndex + 1} | Mode: **${plan.mode}** | Strategy: **${plan.strategy}** | Ending: **${plan.ending}**`,
    "",
    `Mode voice: ${MODE_GUIDE[plan.mode]}`,
    `Strategy shape: ${STRATEGY_GUIDE[plan.strategy]}`,
    formatHumorRule(plan),
    "",
    formatSessionMemory(plan),
    "",
    turnBlock,
    "",
    "## Variety rules",
    "- Do NOT ask a question every turn. Many turns should end on insight alone.",
    "- Do NOT open with 'Now imagine', 'Suppose', or 'Let's imagine' — use the assigned transition.",
    "- Vary structure: teach-only → story → challenge → teach-only → quiz.",
    `- BANNED: ${BANNED_PHRASES.slice(0, 12).map((p) => `"${p}"`).join(", ")}`,
    "",
    "Voice: staff engineer whiteboard session. Memorable lines > polite templates.",
    "Short paragraphs. **Bold** key terms.",
  ].join("\n");
}

export { isLikelyOnTopic, BANNED_PHRASES };
