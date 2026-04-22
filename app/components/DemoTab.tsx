"use client";

import { JSX, useRef, useEffect, useState } from "react";
import type { ChatMessage } from "../types/chat";
import MessageContent from "./MessageContent";
import { RiSendPlane2Line, RiPlayCircleLine } from "react-icons/ri";

const BADGE_TEXT = "Live Chat — streaming chat powered by Groq";
const EMPTY_HEADING = "Ask me anything";
const EMPTY_SUBTEXT =
  "Built with Next.js App Router + Groq llama-3.1-8b-instant";
const PLACEHOLDER = "Ask something…";
const LABEL_SEND = "Send";

const DemoTab = (): JSX.Element => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1]?.content;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastMessage]);

  async function sendMessage(): Promise<void> {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    setMessages((p) => [...p, { role: "assistant", content: "" }]);

    const res = await fetch("/api/demo-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      setMessages((p: ChatMessage[]) => {
        const u = [...p];
        u[u.length - 1] = { ...u[u.length - 1], content: buffer };
        return [...u];
      });
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex min-w-0 flex-none items-center gap-2">
        <span
          className="flex min-w-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <RiPlayCircleLine size={12} className="shrink-0" />
          <span className="min-w-0 break-words">{BADGE_TEXT}</span>
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-0 sm:pr-1">
        <div className="flex flex-col gap-3 pb-2">
          {messages.length === 0 && (
            <div
              className="mt-16 flex flex-col items-center gap-3 text-center"
              style={{ color: "var(--text-muted)" }}
            >
              <RiPlayCircleLine size={32} style={{ opacity: 0.35 }} />
              <p
                className="text-[13px] font-medium"
                style={{ color: "var(--text)" }}
              >
                {EMPTY_HEADING}
              </p>
              <p
                className="text-[11px]"
                style={{ color: "var(--text-muted)", opacity: 0.7 }}
              >
                {EMPTY_SUBTEXT}
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className="msg-in flex min-w-0"
              style={{
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              {msg.role === "assistant" && (
                <div
                  className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  A
                </div>
              )}
              <div
                className="min-w-0 max-w-[88%] break-words rounded-2xl px-3 py-2.5 text-[13px] leading-relaxed sm:max-w-[78%] sm:px-4 lg:max-w-[72%]"
                style={
                  msg.role === "user"
                    ? {
                        background: "var(--text)",
                        color: "#fff",
                        borderBottomRightRadius: 4,
                      }
                    : {
                        background: "var(--accent-soft)",
                        color: "var(--text)",
                        border: "1px solid var(--accent-border)",
                        borderBottomLeftRadius: 4,
                      }
                }
              >
                {msg.content === "" ? (
                  <span className="flex items-center gap-1 py-0.5">
                    <span className="dot dot-1" />
                    <span className="dot dot-2" />
                    <span className="dot dot-3" />
                  </span>
                ) : msg.role === "assistant" ? (
                  <MessageContent content={msg.content} />
                ) : (
                  <span className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div
        className="flex-none border-t pt-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className="min-h-10 w-full min-w-0 flex-1 rounded-xl border px-4 py-2.5 text-[13px] outline-none"
            style={{
              border: "1px solid var(--border-strong)",
              background: "var(--bg)",
              color: "var(--text)",
            }}
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInput(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
              e.key === "Enter" && sendMessage()
            }
            placeholder={PLACEHOLDER}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl px-4 text-[13px] font-semibold text-white transition-opacity sm:w-auto"
            style={{
              background: "var(--accent)",
              opacity: loading || !input.trim() ? 0.45 : 1,
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            }}
          >
            <RiSendPlane2Line size={14} />
            {LABEL_SEND}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoTab;
