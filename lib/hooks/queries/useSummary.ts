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

export function useGenerateSummaryMutation(lesson: {
  id: string;
  title: string;
  content: string;
}) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      generateSummary({
        lessonContent: lesson.content,
        lessonTitle: lesson.title,
        userId: userId!,
        lessonId: lesson.id,
      }),
    meta: { errorMessage: "Failed to generate summary" },
    onSuccess: (summary) => {
      if (!userId) return;
      queryClient.setQueryData(queryKeys.summary(userId, lesson.id), {
        summary,
      });
    },
  });
}
