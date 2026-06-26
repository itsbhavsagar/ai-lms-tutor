import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { LearnerProfile } from "@/lib/db/learner-profile";
import { useUserId } from "@/lib/hooks/useUserId";
import { queryKeys } from "@/lib/query/keys";

export function useLearnerProfileQuery(lessonId: string) {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.learnerProfile(userId ?? "", lessonId),
    queryFn: () =>
      apiGet<{ profile: LearnerProfile }>(
        `/api/learner-profile?userId=${userId}&lessonId=${lessonId}`,
        "Failed to load learner profile",
      ),
    enabled: !!userId,
    staleTime: 30_000,
  });
}
