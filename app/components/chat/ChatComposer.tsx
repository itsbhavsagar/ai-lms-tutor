"use client";

import { useRef, type RefObject } from "react";
import {
  RiSendPlane2Line,
  RiMicLine,
  RiStopCircleLine,
} from "react-icons/ri";
import { chatBtnClass } from "@/lib/chat/interactive";
import { chatComposerFieldClass, chatComposerShellClass } from "@/lib/ui/styles";
import MicRecordHint from "./MicRecordHint";

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
  const micButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={`${chatComposerShellClass} ${className}`.trim()}>
      <textarea
        ref={inputRef}
        rows={1}
        className={`${chatComposerFieldClass} relative z-0`}
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

      <div className="relative z-20 flex shrink-0 items-center gap-1">
        <div className="relative">
          <MicRecordHint
            anchorRef={micButtonRef}
            visible={hintVisible}
            recording={recording}
            recordingSeconds={recordingSeconds}
            releaseToStopLabel={releaseToStopLabel}
            holdToRecordLabel={holdToRecordLabel}
            formatRecordingTime={formatRecordingTime}
          />

          <button
            ref={micButtonRef}
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
          className={`${chatBtnClass} relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent hover:opacity-90 ${
            canSend ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-45"
          }`}
        >
          <RiSendPlane2Line size={15} />
        </button>
      </div>
    </div>
  );
}
