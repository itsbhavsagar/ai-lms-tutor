"use client";

import { JSX, useRef, useEffect, useState } from "react";
import type { ChatMessage } from "../types/chat";
import MessageContent from "./MessageContent";
import SimpleChatComposer from "./chat/SimpleChatComposer";
import { streamDemoChat } from "@/lib/api/chat";
import { readTextStream } from "@/lib/api/client";
import { withApiToast } from "@/lib/utils/withApiToast";
import { RiPlayCircleLine } from "react-icons/ri";
import {
  chatComposerFooterClass,
  chatTabBodyClass,
  chatTabInnerClass,
  chatTabShellClass,
  scrollAreaClass,
} from "@/lib/ui/styles";

const BADGE_TEXT = "Live Chat — streaming chat powered by Groq";
const EMPTY_HEADING = "Ask me anything";
const EMPTY_SUBTEXT =
  "Built with Next.js App Router + Groq llama-3.1-8b-instant";
const PLACEHOLDER = "Ask anything... you want to know!";
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

    const response = await withApiToast("Chat failed", () =>
      streamDemoChat(history),
    );

    if (response) {
      await readTextStream(response, (buffer) => {
        setMessages((p: ChatMessage[]) => {
          const u = [...p];
          u[u.length - 1] = { ...u[u.length - 1], content: buffer };
          return u;
        });
      });
    } else {
      setMessages((p) => p.slice(0, -1));
    }

    setLoading(false);
  }

  return (
    <div className={chatTabShellClass}>
      <div className={chatTabInnerClass}>
        <div className={chatTabBodyClass}>
          <div className="mb-3 flex min-w-0 flex-none items-center gap-2">
            <span className="flex min-w-0 items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-[11px] font-semibold text-accent">
              <RiPlayCircleLine size={12} className="shrink-0" />
              <span className="min-w-0 wrap-wrap-wrap-break-word">{BADGE_TEXT}</span>
            </span>
          </div>

          <div className={scrollAreaClass}>
            <div className="flex flex-col gap-3 pb-2">
              {messages.length === 0 && (
                <div className="mt-16 flex flex-col items-center gap-3 text-center text-muted">
                  <RiPlayCircleLine size={32} className="opacity-35" />
                  <p className="text-[13px] font-medium text-ink">
                    {EMPTY_HEADING}
                  </p>
                  <p className="text-[11px] opacity-70">{EMPTY_SUBTEXT}</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`msg-in flex min-w-0 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-on-accent">
                      A
                    </div>
                  )}
                  <div
                    className={`min-w-0 max-w-[88%] wrap-wrap-wrap-break-word rounded-2xl px-3 py-2.5 text-[13px] leading-relaxed sm:max-w-[78%] sm:px-4 lg:max-w-[72%] ${
                      msg.role === "user"
                        ? "rounded-br-sm bg-chat-user text-chat-user-fg"
                        : "rounded-bl-sm border border-accent-border bg-accent-soft text-ink"
                    }`}
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
                      <span className="whitespace-pre-wrap wrap-wrap-wrap-break-word">
                        {msg.content}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className={chatComposerFooterClass}>
            <SimpleChatComposer
              value={input}
              onChange={setInput}
              onSend={sendMessage}
              placeholder={PLACEHOLDER}
              loading={loading}
              sendLabel={LABEL_SEND}
              autoFocus={messages.length === 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoTab;
