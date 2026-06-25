import { apiGet, apiPost } from "./client";

type Summary = {
  overview: string;
  keyPoints: string[];
  remember: string;
};

type SummaryGetResponse = {
  summary: Summary | null;
};

export function fetchSummary(userId: string, lessonId: string) {
  return apiGet<SummaryGetResponse>(
    `/api/summary?userId=${userId}&lessonId=${lessonId}`,
    "Failed to load summary",
  );
}

export function generateSummary(payload: {
  lessonContent: string;
  lessonTitle: string;
  userId: string;
  lessonId: string;
}) {
  return apiPost<Summary>("/api/summary", payload, "Failed to generate summary");
}
