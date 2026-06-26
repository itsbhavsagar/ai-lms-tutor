export type PersonalizedReview = {
  understood: string[];
  struggled: string[];
  suggestedRevision: string;
  revisionMinutes: number;
  commonInterviewMistake: string;
  productionExample: string;
  mentorNote: string;
};

/** Legacy generic summary shape. */
export type LegacySummary = {
  executiveSummary: string;
  keyConcepts: string[];
  commonMistakes: string[];
  productionInsights: string[];
  interviewTakeaways: string[];
  furtherReading: string[];
};

export type Review = PersonalizedReview | LegacySummary;

export function isPersonalizedReview(
  data: Record<string, unknown>,
): data is PersonalizedReview {
  return "understood" in data && "struggled" in data;
}

export function normalizeReview(
  data: Record<string, unknown> | null,
): Review | null {
  if (!data) return null;

  if (isPersonalizedReview(data)) {
    return data as PersonalizedReview;
  }

  if ("executiveSummary" in data) {
    return data as LegacySummary;
  }

  if ("overview" in data) {
    return {
      executiveSummary: String(data.overview ?? ""),
      keyConcepts: Array.isArray(data.keyPoints)
        ? data.keyPoints.map(String)
        : [],
      commonMistakes: [],
      productionInsights: [],
      interviewTakeaways: data.remember ? [String(data.remember)] : [],
      furtherReading: [],
    };
  }

  return null;
}
