{
  /*
    1 - CREATE A CHAT UI
    2 - STAREAM THE RESPONSE FORM THE AI - [ CAN I GROK ]
    */
}

import { JSX, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

const DemoTab = (): JSX.Element => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  async function sendMessage(): Promise<void> {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages: Message[] = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const res = await fetch("/api/demo-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: updatedMessages }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer: string = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      setMessages((prev: Message[]) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: buffer,
        };
        return [...updated];
      });
    }

    setLoading(false);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "20px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{ color: "#888", textAlign: "center", marginTop: "48px" }}
          >
            Ask me anything ✦
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              maxWidth: "70%",
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user" ? "#6366f1" : "#1e1e2e",
              color: "#fff",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div style={{ color: "#888", fontSize: "14px" }}>Thinking...</div>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #333",
            background: "#1e1e2e",
            color: "#fff",
            fontSize: "14px",
            outline: "none",
          }}
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setInput(e.target.value)
          }
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
            e.key === "Enter" && sendMessage()
          }
          placeholder="Ask something..."
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            padding: "12px 20px",
            borderRadius: "8px",
            background: "#6366f1",
            color: "#fff",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default DemoTab;
