import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchQuiz, generateQuiz, submitQuiz } from "@/lib/api/quiz";
import { useUserId } from "@/lib/hooks/useUserId";
import { queryKeys } from "@/lib/query/keys";

export function useQuizQuery(lessonId: string) {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.quiz(userId ?? "", lessonId),
    queryFn: () => fetchQuiz(userId!, lessonId),
    enabled: !!userId,
    meta: { errorMessage: "Failed to load quiz" },
  });
}

export function useGenerateQuizMutation(lessonId: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      generateQuiz({
        userId: userId!,
        lessonId,
      }),
    meta: { errorMessage: "Failed to generate quiz" },
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.quiz(userId, lessonId),
      });
    },
  });
}

export function useSubmitQuizMutation(lessonId: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      quizId: string;
      score: number;
      total: number;
      weakConcepts?: string[];
    }) => submitQuiz(payload),
    meta: { errorMessage: "Failed to submit quiz" },
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.quiz(userId, lessonId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.learnerProfile(userId, lessonId),
      });
    },
  });
}
