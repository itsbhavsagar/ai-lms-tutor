import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { fetchMessages } from "@/lib/api/messages";
import { createSession } from "@/lib/api/sessions";
import type { ChatMessage } from "@/app/types/chat";
import { queryKeys } from "@/lib/query/keys";
import { useUserId } from "@/lib/hooks/useUserId";

type MessagesPage = Awaited<ReturnType<typeof fetchMessages>>;

export function flattenMessages(
  data: InfiniteData<MessagesPage> | undefined,
): ChatMessage[] {
  if (!data?.pages.length) return [];
  return data.pages
    .slice()
    .reverse()
    .flatMap((page) => page.messages);
}

export function readCachedMessages(
  queryClient: QueryClient,
  sessionId: string,
): ChatMessage[] {
  const cached = queryClient.getQueryData<InfiniteData<MessagesPage>>(
    queryKeys.messages(sessionId),
  );
  return flattenMessages(cached);
}

export function useMessagesQuery(sessionId: string | null) {
  return useInfiniteQuery({
    queryKey: queryKeys.messages(sessionId ?? ""),
    queryFn: ({ pageParam }) => fetchMessages(sessionId!, pageParam),
    enabled: !!sessionId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    meta: { errorMessage: "Failed to load messages" },
  });
}

export function useCreateSessionMutation(lessonId?: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      userId: string;
      lessonId: string;
      title: string;
    }) => createSession(payload.userId, payload.lessonId, payload.title),
    meta: { errorMessage: "Failed to create chat session" },
    onSuccess: (_data, variables) => {
      const resolvedLessonId = lessonId ?? variables.lessonId;
      if (!userId || !resolvedLessonId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions(userId, resolvedLessonId),
      });
    },
  });
}

export function useUpdateMessagesCache(sessionId: string | null) {
  const queryClient = useQueryClient();

  return (messages: ChatMessage[], nextCursor: string | null = null) => {
    if (!sessionId) return;
    queryClient.setQueryData<InfiniteData<MessagesPage>>(
      queryKeys.messages(sessionId),
      {
        pages: [{ messages, nextCursor }],
        pageParams: [undefined],
      },
    );
  };
}
