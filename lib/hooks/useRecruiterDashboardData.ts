"use client";

import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { useUserId } from "@/lib/hooks/useUserId";

export function useRecruiterDashboardData(lessonId: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  const cacheSnapshot = userId
    ? {
        quiz: queryClient.getQueryData(queryKeys.quiz(userId, lessonId)),
        summary: queryClient.getQueryData(queryKeys.summary(userId, lessonId)),
        notes: queryClient.getQueryData(queryKeys.notes(userId, lessonId)),
        sessions: queryClient.getQueryData(
          queryKeys.sessions(userId, lessonId),
        ),
        learnerProfile: queryClient.getQueryData(
          queryKeys.learnerProfile(userId, lessonId),
        ),
        ragIndex: queryClient.getQueryData(queryKeys.ragIndex(userId, lessonId)),
      }
    : null;

  return { userId, cacheSnapshot };
}
