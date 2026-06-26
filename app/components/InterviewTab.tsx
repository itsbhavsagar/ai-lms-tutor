"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types/chat";
import type { Lesson } from "../data/lessons";
import MessageContent from "./MessageContent";
import { streamInterviewChat } from "@/lib/api/chat";
import { getClientErrorMessage, readTextStream } from "@/lib/api/client";
import { getOrCreateUserId } from "@/lib/utils/localStorage";
import { markInterviewComplete } from "@/lib/learning/progress";
import { showError } from "@/lib/utils/toast";
import PrimaryButton from "./ui/PrimaryButton";
import { RiSendPlane2Line, RiUserVoiceLine } from "react-icons/ri";
import { inputFieldClass, panelHeadingClass, panelSubtextClass, scrollAreaClass } from "@/lib/ui/styles";

export default function InterviewTab({ lesson }: { lesson: Lesson }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userId = getOrCreateUserId();

  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [lesson.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startInterview() {
    if (loading) return;
    await sendMessage("Start the interview. Ask your first question.");
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = { role: "user", content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    setMessages((p) => [...p, { role: "assistant", content: "" }]);

    try {
      const response = await streamInterviewChat(history, lesson.id, userId);
      await readTextStream(response, (buffer) => {
        setMessages((p) => {
          const u = [...p];
          u[u.length - 1] = { ...u[u.length - 1], content: buffer };
          return u;
        });
      });
      if (content !== "Start the interview. Ask your first question.") {
        markInterviewComplete(userId, lesson.id);
      }
    } catch (error) {
      showError(getClientErrorMessage(error, "Interview failed"));
      setMessages((p) => p.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className={panelHeadingClass}>
            Mock Interview
          </h2>
          <p className={panelSubtextClass}>
            AI interviewer for {lesson.title} — adapts to your quiz performance
          </p>
        </div>
        {messages.length === 0 && (
          <PrimaryButton onClick={startInterview} disabled={loading} fullWidth>
            <RiUserVoiceLine size={14} />
            Begin Interview
          </PrimaryButton>
        )}
      </div>

      <div className={`${scrollAreaClass} pr-0 sm:pr-1`}>
        <div className="flex flex-col gap-3 pb-2">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted">
              <RiUserVoiceLine size={32} className="opacity-35" />
              <p className="text-[13px] font-medium text-ink">
                Practice like a real technical interview
              </p>
              <p className="max-w-sm text-[12px] leading-relaxed">
                Questions are generated dynamically from lesson objectives — not
                from a fixed question bank.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`msg-in flex min-w-0 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-on-accent">
                  I
                </div>
              )}
              <div
                className={`min-w-0 max-w-[88%] wrap-wrap-break-word rounded-2xl px-3 py-2.5 text-[13px] leading-relaxed sm:max-w-[78%] sm:px-4 ${
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
                  <span className="whitespace-pre-wrap wrap-wrap-break-word">
                    {msg.content}
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {messages.length > 0 && (
        <div className="flex-none border-t border-border pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className={`${inputFieldClass} min-h-10 w-full min-w-0 flex-1 rounded-xl px-4 py-2.5 text-[13px]`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your answer…"
              disabled={loading}
            />
            <PrimaryButton
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              fullWidth
            >
              <RiSendPlane2Line size={14} />
              Answer
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
