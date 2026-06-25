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

export function useGenerateQuizMutation(lesson: {
  id: string;
  title: string;
  content: string;
}) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      generateQuiz({
        lessonContent: lesson.content,
        lessonTitle: lesson.title,
        userId: userId!,
        lessonId: lesson.id,
      }),
    meta: { errorMessage: "Failed to generate quiz" },
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.quiz(userId, lesson.id),
      });
    },
  });
}

export function useSubmitQuizMutation(lessonId: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { quizId: string; score: number; total: number }) =>
      submitQuiz(payload),
    meta: { errorMessage: "Failed to submit quiz" },
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.quiz(userId, lessonId),
      });
    },
  });
}
