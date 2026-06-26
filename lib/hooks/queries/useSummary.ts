import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSummary, generateSummary } from "@/lib/api/summary";
import { useUserId } from "@/lib/hooks/useUserId";
import { queryKeys } from "@/lib/query/keys";

export function useSummaryQuery(lessonId: string) {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.summary(userId ?? "", lessonId),
    queryFn: () => fetchSummary(userId!, lessonId),
    enabled: !!userId,
    meta: { errorMessage: "Failed to load summary" },
  });
}

export function useGenerateSummaryMutation(lessonId: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      generateSummary({
        userId: userId!,
        lessonId,
      }),
    meta: { errorMessage: "Failed to generate summary" },
    onSuccess: (summary) => {
      if (!userId) return;
      queryClient.setQueryData(queryKeys.summary(userId, lessonId), {
        summary,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.learnerProfile(userId, lessonId),
      });
    },
  });
}
