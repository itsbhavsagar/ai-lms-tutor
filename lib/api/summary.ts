import { apiGet, apiPost } from "./client";
import type { Review } from "@/app/types/summary";
import { normalizeReview } from "@/app/types/summary";

type SummaryGetResponse = {
  summary: Record<string, unknown> | null;
};

export function fetchSummary(userId: string, lessonId: string) {
  return apiGet<SummaryGetResponse>(
    `/api/summary?userId=${userId}&lessonId=${lessonId}`,
    "Failed to load summary",
  ).then((data) => ({
    summary: normalizeReview(data.summary),
  }));
}

export function generateSummary(payload: { userId: string; lessonId: string }) {
  return apiPost<Review>("/api/summary", payload, "Failed to generate review");
}
