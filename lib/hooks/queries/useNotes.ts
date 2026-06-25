import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchNotes, saveNote } from "@/lib/api/notes";
import { useUserId } from "@/lib/hooks/useUserId";
import { queryKeys } from "@/lib/query/keys";

export function useNotesQuery(lessonId: string) {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.notes(userId ?? "", lessonId),
    queryFn: () => fetchNotes(userId!, lessonId),
    enabled: !!userId,
    meta: { errorMessage: "Failed to load notes" },
  });
}

export function useSaveNoteMutation(lessonId: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => saveNote(userId!, lessonId, content),
    meta: { errorMessage: "Failed to save notes" },
    onSuccess: (data) => {
      if (!userId) return;
      queryClient.setQueryData(queryKeys.notes(userId, lessonId), {
        note: data.note,
      });
    },
  });
}
