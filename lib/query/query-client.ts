import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { getClientErrorMessage } from "@/lib/api/client";
import { showError } from "@/lib/utils/toast";
import { GC_TIME_MS, STALE_TIME_MS } from "./config";

function getErrorFallback(meta: unknown): string {
  if (meta && typeof meta === "object" && "errorMessage" in meta) {
    const message = (meta as { errorMessage?: unknown }).errorMessage;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Something went wrong. Please try again.";
}

export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        showError(getClientErrorMessage(error, getErrorFallback(query.meta)));
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        showError(getClientErrorMessage(error, getErrorFallback(mutation.meta)));
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
