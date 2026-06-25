"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query/query-client";
import AppToaster from "./components/AppToaster";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AppToaster />
      {children}
    </QueryClientProvider>
  );
}
