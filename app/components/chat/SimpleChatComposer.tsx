"use client";

import { useCallback, useEffect, useRef } from "react";
import { RiSendPlane2Line } from "react-icons/ri";
import { chatBtnClass } from "@/lib/chat/interactive";
import { chatComposerFieldClass, chatComposerShellClass } from "@/lib/ui/styles";

type SimpleChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  sendLabel?: string;
  autoFocus?: boolean;
  className?: string;
};

export default function SimpleChatComposer({
  value,
  onChange,
  onSend,
  placeholder,
  disabled = false,
  loading = false,
  sendLabel = "Send",
  autoFocus = false,
  className = "",
}: SimpleChatComposerProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const canSend = !loading && !disabled && !!value.trim();

  const resizeInput = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    resizeInput();
  }, [value, resizeInput]);

  return (
    <div className={`${chatComposerShellClass} ${className}`.trim()}>
      <textarea
        ref={inputRef}
        rows={1}
        className={chatComposerFieldClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (canSend) onSend();
          }
        }}
        placeholder={placeholder}
        disabled={disabled || loading}
        autoFocus={autoFocus}
      />

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
  );
}
