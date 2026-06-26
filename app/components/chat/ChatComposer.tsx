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

  const hintVisible = recording || showMicHint;

  return (
    <div
      className={`chat-composer relative w-full ${className}`.trim()}
    >
      <textarea
        ref={inputRef}
        rows={1}
        className="chat-composer-field block min-h-11 max-h-40 w-full resize-none overflow-y-auto border-0 bg-transparent px-3 pt-2.5 pb-10 pr-18 text-[13px] leading-relaxed text-ink outline-none focus:outline-none focus-visible:outline-none"
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
            className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 max-w-[calc(100vw-4rem)] -translate-x-1/2 rounded-lg border px-2.5 py-1 text-center text-[11px] whitespace-normal transition-all duration-200 sm:max-w-none sm:whitespace-nowrap ${
              recording
                ? "border-red-border bg-red-soft text-red"
                : "border-accent-border bg-accent-soft text-ink"
            } ${hintVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}
          >
            <span className="inline-flex items-center gap-1.5">
              {recording && (
                <span className="rec-pulse inline-block h-1.5 w-1.5 rounded-full bg-red" />
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
            className={`${chatBtnClass} flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:opacity-80 ${
              recording
                ? "bg-red-soft text-red"
                : "bg-transparent text-muted"
            } ${transcribing || disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
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
          className={`${chatBtnClass} flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent hover:opacity-90 ${
            canSend ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-45"
          }`}
        >
          <RiSendPlane2Line size={15} />
        </button>
      </div>
    </div>
  );
}
