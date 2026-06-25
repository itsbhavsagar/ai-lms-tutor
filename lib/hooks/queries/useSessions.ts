import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteSession, fetchSessions } from "@/lib/api/sessions";
import { useUserId } from "@/lib/hooks/useUserId";
import { queryKeys } from "@/lib/query/keys";

export function useSessionsQuery(lessonId: string) {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.sessions(userId ?? "", lessonId),
    queryFn: () => fetchSessions(userId!, lessonId),
    enabled: !!userId,
    meta: { errorMessage: "Failed to load conversations" },
  });
}

export function useDeleteSessionMutation(lessonId: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => deleteSession(sessionId),
    meta: { errorMessage: "Failed to delete chat" },
    onSuccess: (_data, sessionId) => {
      if (!userId) return;
      queryClient.setQueryData<{ sessions: Awaited<ReturnType<typeof fetchSessions>>["sessions"]; count: number }>(
        queryKeys.sessions(userId, lessonId),
        (old) => {
          if (!old) return old;
          const sessions = old.sessions.filter((s) => s.id !== sessionId);
          return { sessions, count: sessions.length };
        },
      );
      queryClient.removeQueries({
        queryKey: queryKeys.messages(sessionId),
      });
    },
  });
}
