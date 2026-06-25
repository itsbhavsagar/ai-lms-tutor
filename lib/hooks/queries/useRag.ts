import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { embedText, uploadPdf } from "@/lib/api/rag";
import { useUserId } from "@/lib/hooks/useUserId";
import { queryKeys } from "@/lib/query/keys";
import {
  defaultRagIndexState,
  type RagIndexState,
} from "./rag-index";

export function useRagIndexQuery(lessonId: string) {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.ragIndex(userId ?? "", lessonId),
    queryFn: (): RagIndexState => defaultRagIndexState,
    enabled: !!userId,
    staleTime: Infinity,
    initialData: defaultRagIndexState,
  });
}

export function useRagIndexMutation(lessonId: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { mode: "paste"; text: string } | { mode: "pdf"; file: File }) => {
      if (input.mode === "paste") {
        return embedText(input.text, lessonId, userId!);
      }
      return uploadPdf(input.file, lessonId, userId!);
    },
    meta: { errorMessage: "Failed to index content" },
    onSuccess: (result) => {
      if (!userId) return;
      const next: RagIndexState = {
        indexed: true,
        chunksCreated: result.chunksCreated,
        pages: "pages" in result && typeof result.pages === "number" ? result.pages : 0,
      };
      queryClient.setQueryData(queryKeys.ragIndex(userId, lessonId), next);
    },
  });
}

export function useResetRagIndexMutation(lessonId: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => defaultRagIndexState,
    onSuccess: (state) => {
      if (!userId) return;
      queryClient.setQueryData(queryKeys.ragIndex(userId, lessonId), state);
    },
  });
}
