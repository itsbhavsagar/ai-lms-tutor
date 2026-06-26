"use client";

import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

type MicRecordHintProps = {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  visible: boolean;
  recording: boolean;
  recordingSeconds: number;
  releaseToStopLabel: string;
  holdToRecordLabel: string;
  formatRecordingTime: (seconds: number) => string;
};

function positionHint(hintEl: HTMLDivElement, anchor: HTMLButtonElement) {
  const rect = anchor.getBoundingClientRect();
  hintEl.style.top = `${rect.top - 8}px`;
  hintEl.style.right = `${window.innerWidth - rect.right}px`;
}

export default function MicRecordHint({
  anchorRef,
  visible,
  recording,
  recordingSeconds,
  releaseToStopLabel,
  holdToRecordLabel,
  formatRecordingTime,
}: MicRecordHintProps) {
  const hintRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!visible) return;

    const updatePosition = () => {
      const anchor = anchorRef.current;
      const hint = hintRef.current;
      if (!anchor || !hint) return;
      positionHint(hint, anchor);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [visible, recording, recordingSeconds, anchorRef]);

  if (!visible) return null;

  return createPortal(
    <div
      ref={hintRef}
      role="status"
      aria-live="polite"
      className={`mic-record-hint pointer-events-none fixed z-9999 max-w-[calc(100vw-2rem)] rounded-lg border px-2.5 py-1 text-[11px] shadow-md transition-all duration-200 sm:max-w-none sm:whitespace-nowrap ${
        recording
          ? "border-red-border bg-red-soft text-red"
          : "border-accent-border bg-accent-soft text-ink"
      }`}
      style={{ transform: "translateY(-100%)" }}
    >
      <span className="inline-flex items-center gap-1.5">
        {recording && (
          <span className="rec-pulse inline-block h-1.5 w-1.5 rounded-full bg-red" />
        )}
        {recording
          ? `${releaseToStopLabel} • ${formatRecordingTime(recordingSeconds)}`
          : holdToRecordLabel}
      </span>
    </div>,
    document.body,
  );
}
