"use client";

import { useEffect, useState } from "react";
import { getOrCreateUserId } from "@/lib/utils/localStorage";

export function useUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(getOrCreateUserId());
  }, []);

  return userId;
}
