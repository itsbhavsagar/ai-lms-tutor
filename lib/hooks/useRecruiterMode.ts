"use client";

import { useSyncExternalStore } from "react";
import {
  isRecruiterMode,
  setRecruiterMode,
  subscribeRecruiterMode,
} from "@/lib/utils/recruiterMode";

export function useRecruiterMode() {
  const enabled = useSyncExternalStore(
    subscribeRecruiterMode,
    isRecruiterMode,
    () => false,
  );

  return {
    enabled,
    toggle: () => setRecruiterMode(!enabled),
    set: setRecruiterMode,
  };
}
