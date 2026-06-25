import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createNote,
  deleteNote,
  fetchNotes,
  updateNote,
  type NoteItem,
} from "@/lib/api/notes";
import { useUserId } from "@/lib/hooks/useUserId";
import { queryKeys } from "@/lib/query/keys";

type NotesCache = { notes: NoteItem[] };

export function useNotesQuery(lessonId: string) {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.notes(userId ?? "", lessonId),
    queryFn: () => fetchNotes(userId!, lessonId),
    enabled: !!userId,
    meta: { errorMessage: "Failed to load notes" },
  });
}

export function useCreateNoteMutation(lessonId: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: { title?: string; content?: string }) =>
      createNote(userId!, lessonId, payload ?? {}),
    meta: { errorMessage: "Failed to create note" },
    onSuccess: (data) => {
      if (!userId) return;
      queryClient.setQueryData<NotesCache>(
        queryKeys.notes(userId, lessonId),
        (old) => ({
          notes: [data.note, ...(old?.notes ?? [])],
        }),
      );
    },
  });
}

export function useUpdateNoteMutation(lessonId: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      noteId: string;
      title: string;
      content: string;
    }) => updateNote(payload.noteId, payload),
    meta: { errorMessage: "Failed to save note" },
    onSuccess: (data) => {
      if (!userId) return;
      queryClient.setQueryData<NotesCache>(
        queryKeys.notes(userId, lessonId),
        (old) => ({
          notes: (old?.notes ?? [])
            .map((n) => (n.id === data.note.id ? data.note : n))
            .sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
            ),
        }),
      );
    },
  });
}

export function useDeleteNoteMutation(lessonId: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) => deleteNote(noteId),
    meta: { errorMessage: "Failed to delete note" },
    onMutate: async (noteId) => {
      if (!userId) return;
      await queryClient.cancelQueries({
        queryKey: queryKeys.notes(userId, lessonId),
      });
      const previous = queryClient.getQueryData<NotesCache>(
        queryKeys.notes(userId, lessonId),
      );
      queryClient.setQueryData<NotesCache>(
        queryKeys.notes(userId, lessonId),
        (old) => ({
          notes: (old?.notes ?? []).filter((n) => n.id !== noteId),
        }),
      );
      return { previous };
    },
    onError: (_error, _noteId, context) => {
      if (!userId || !context?.previous) return;
      queryClient.setQueryData(
        queryKeys.notes(userId, lessonId),
        context.previous,
      );
    },
    onSuccess: (_data, noteId) => {
      if (!userId) return;
      queryClient.setQueryData<NotesCache>(
        queryKeys.notes(userId, lessonId),
        (old) => ({
          notes: (old?.notes ?? []).filter((n) => n.id !== noteId),
        }),
      );
    },
  });
}
