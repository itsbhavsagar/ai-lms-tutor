"use client";

import { useSyncExternalStore } from "react";
import { getOrCreateUserId } from "@/lib/utils/localStorage";

function subscribe() {
  return () => {};
}

export function useUserId(): string | null {
  return useSyncExternalStore(subscribe, getOrCreateUserId, () => null);
}
