"use client";

import type { RefObject } from "react";
import {
  RiSendPlane2Line,
  RiMicLine,
  RiStopCircleLine,
} from "react-icons/ri";
import { chatBtnClass } from "@/lib/chat/interactive";

type ChatComposerProps = {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  transcribing?: boolean;
  userId: string | null;
  recording: boolean;
  recordingSeconds: number;
  showMicHint: boolean;
  onShowMicHint: (show: boolean) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  formatRecordingTime: (seconds: number) => string;
  holdToRecordLabel: string;
  releaseToStopLabel: string;
  sendLabel: string;
  transcribingLabel: string;
  autoFocus?: boolean;
  className?: string;
};

export default function ChatComposer({
  inputRef,
  input,
  onInputChange,
  onSend,
  placeholder,
  disabled = false,
  loading = false,
  transcribing = false,
  userId,
  recording,
  recordingSeconds,
  showMicHint,
  onShowMicHint,
  onStartRecording,
  onStopRecording,
  formatRecordingTime,
  holdToRecordLabel,
  releaseToStopLabel,
  sendLabel,
  transcribingLabel,
  autoFocus = false,
  className = "",
}: ChatComposerProps) {
  const canSend =
    !loading && !transcribing && !!input.trim() && !!userId && !disabled;

  return (
    <div
      className={`chat-composer relative w-full rounded-xl border ${className}`.trim()}
      style={{
        border: "1px solid var(--border-strong)",
        background: "var(--input-bg)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <textarea
        ref={inputRef}
        rows={1}
        className="chat-composer-field block min-h-11 max-h-40 w-full resize-none overflow-y-auto border-0 bg-transparent px-3 pt-2.5 pb-10 pr-18 text-[13px] leading-relaxed outline-none focus:outline-none focus-visible:outline-none"
        style={{ color: "var(--text)" }}
        value={transcribing ? transcribingLabel : input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (canSend) onSend();
          }
        }}
        placeholder={placeholder}
        disabled={transcribing || disabled}
        autoFocus={autoFocus}
      />

      <div className="absolute right-2 bottom-2 flex items-center gap-1">
        <div className="relative">
          <div
            className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 max-w-[calc(100vw-4rem)] -translate-x-1/2 rounded-lg px-2.5 py-1 text-center text-[11px] whitespace-normal transition-all duration-200 sm:max-w-none sm:whitespace-nowrap"
            style={{
              background: recording ? "var(--red-soft)" : "var(--accent-soft)",
              border: `1px solid ${recording ? "var(--red-border)" : "var(--accent-border)"}`,
              color: recording ? "var(--red)" : "var(--text)",
              opacity: recording || showMicHint ? 1 : 0,
              transform: `translateX(-50%) translateY(${recording || showMicHint ? "0px" : "4px"})`,
            }}
          >
            <span className="inline-flex items-center gap-1.5">
              {recording && (
                <span
                  className="rec-pulse inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--red)" }}
                />
              )}
              {recording
                ? `${releaseToStopLabel} • ${formatRecordingTime(recordingSeconds)}`
                : holdToRecordLabel}
            </span>
          </div>

          <button
            type="button"
            onMouseDown={onStartRecording}
            onMouseUp={onStopRecording}
            onMouseLeave={onStopRecording}
            onMouseEnter={() => onShowMicHint(true)}
            onTouchStart={onStartRecording}
            onTouchEnd={onStopRecording}
            onTouchCancel={onStopRecording}
            onBlur={() => onShowMicHint(false)}
            onFocus={() => onShowMicHint(true)}
            aria-label={recording ? releaseToStopLabel : holdToRecordLabel}
            disabled={transcribing || disabled}
            className={`${chatBtnClass} flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:opacity-80`}
            style={{
              color: recording ? "var(--red)" : "var(--text-muted)",
              background: recording ? "var(--red-soft)" : "transparent",
              opacity: transcribing || disabled ? 0.5 : 1,
              cursor: transcribing || disabled ? "not-allowed" : "pointer",
            }}
          >
            {recording ? (
              <RiStopCircleLine size={17} />
            ) : (
              <RiMicLine size={17} />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label={sendLabel}
          className={`${chatBtnClass} flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:opacity-90`}
          style={{
            background: "var(--accent)",
            color: "var(--on-accent)",
            opacity: canSend ? 1 : 0.45,
            cursor: canSend ? "pointer" : "not-allowed",
          }}
        >
          <RiSendPlane2Line size={15} />
        </button>
      </div>
    </div>
  );
}
