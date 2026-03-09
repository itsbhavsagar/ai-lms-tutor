// "use client";
// import { useState, useRef, useEffect } from "react";
// import { Lesson } from "../data/lessons";

// type Message = { role: "user" | "assistant"; content: string };

// export default function ChatTab({ lesson }: { lesson: Lesson }) {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const bottomRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     setMessages([]);
//     setInput("");
//   }, [lesson.id]);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   async function sendMessage() {
//     if (!input.trim() || loading) return;

//     const userMessage: Message = { role: "user", content: input };
//     const updatedMessages = [...messages, userMessage];
//     setMessages(updatedMessages);
//     setInput("");
//     setLoading(true);

//     setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

//     const res = await fetch("/api/chat", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         messages: updatedMessages,
//         lessonContent: lesson.content,
//       }),
//     });

//     const reader = res.body!.getReader();
//     const decoder = new TextDecoder();
//     let buffer = "";

//     while (true) {
//       const { done, value } = await reader.read();
//       if (done) break;
//       buffer += decoder.decode(value, { stream: true });
//       setMessages((prev) => {
//         const updated = [...prev];
//         updated[updated.length - 1].content = buffer;
//         return [...updated];
//       });
//     }

//     setLoading(false);
//   }

//   return (
//     <div
//       style={{
//         display: "flex",
//         flexDirection: "column",
//         flex: 1,
//         overflow: "hidden",
//       }}
//     >
//       <div
//         style={{
//           flex: 1,
//           overflowY: "auto",
//           display: "flex",
//           flexDirection: "column",
//           gap: "12px",
//           marginBottom: "16px",
//           paddingRight: "4px",
//         }}
//       >
//         {messages.length === 0 && (
//           <div
//             style={{
//               textAlign: "center",
//               color: "var(--text-muted)",
//               fontSize: "14px",
//               marginTop: "48px",
//             }}
//           >
//             Ask anything about {lesson.title} ✦
//           </div>
//         )}
//         {messages.map((msg, i) => (
//           <div
//             key={i}
//             style={{
//               padding: "12px 16px",
//               borderRadius: "12px",
//               maxWidth: "72%",
//               fontSize: "14px",
//               lineHeight: "1.6",
//               alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
//               background:
//                 msg.role === "user" ? "var(--accent)" : "var(--surface)",
//               color: msg.role === "user" ? "#fff" : "var(--text)",
//               border: msg.role === "user" ? "none" : "1px solid var(--border)",
//             }}
//           >
//             {msg.content}
//           </div>
//         ))}
//         {loading && (
//           <div
//             style={{
//               padding: "12px 16px",
//               borderRadius: "12px",
//               maxWidth: "72%",
//               background: "var(--surface)",
//               border: "1px solid var(--border)",
//               color: "var(--text-muted)",
//               fontSize: "14px",
//             }}
//           >
//             Thinking...
//           </div>
//         )}
//         <div ref={bottomRef} />
//       </div>

//       <div style={{ display: "flex", gap: "8px" }}>
//         <input
//           style={{
//             flex: 1,
//             padding: "12px 16px",
//             borderRadius: "10px",
//             border: "1px solid var(--border)",
//             background: "var(--surface)",
//             fontSize: "14px",
//             color: "var(--text)",
//             outline: "none",
//             fontFamily: "inherit",
//           }}
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//           placeholder={`Ask about ${lesson.title}...`}
//         />
//         <button
//           onClick={sendMessage}
//           disabled={loading}
//           style={{
//             padding: "12px 20px",
//             borderRadius: "10px",
//             border: "none",
//             background: "var(--accent)",
//             color: "#fff",
//             fontSize: "14px",
//             fontWeight: 500,
//             cursor: "pointer",
//             opacity: loading ? 0.5 : 1,
//             fontFamily: "inherit",
//             transition: "opacity 0.15s",
//           }}
//         >
//           Send
//         </button>
//       </div>
//     </div>
//   );
// }

"use client";
import { useState, useRef, useEffect } from "react";
import { Lesson } from "../data/lessons";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatTab({ lesson }: { lesson: Lesson }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [lesson.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Try wav first, fallback to webm
      const mimeType = MediaRecorder.isTypeSupported("audio/wav")
        ? "audio/wav"
        : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        await transcribeAudio(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Microphone access denied.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setTranscribing(true);
    }
  }

  async function transcribeAudio(blob: Blob) {
    try {
      const formData = new FormData();
      const ext = blob.type.includes("wav") ? "wav" : "webm";
      formData.append("audio", blob, `recording.${ext}`);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.text) setInput(data.text);
    } catch (err) {
      console.error("Transcription failed:", err);
    } finally {
      setTranscribing(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: updatedMessages,
        lessonContent: lesson.content,
      }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content = buffer;
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
        flex: 1,
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
          paddingRight: "4px",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "14px",
              marginTop: "48px",
            }}
          >
            Ask anything about {lesson.title} ✦
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              maxWidth: "72%",
              fontSize: "14px",
              lineHeight: "1.6",
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background:
                msg.role === "user" ? "var(--accent)" : "var(--surface)",
              color: msg.role === "user" ? "#fff" : "var(--text)",
              border: msg.role === "user" ? "none" : "1px solid var(--border)",
            }}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              maxWidth: "72%",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              fontSize: "14px",
            }}
          >
            Thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Row */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            fontSize: "14px",
            color: "var(--text)",
            outline: "none",
            fontFamily: "inherit",
          }}
          value={transcribing ? "Transcribing..." : input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={`Ask about ${lesson.title}...`}
          disabled={transcribing}
        />

        {/* Mic Button */}
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={transcribing}
          title="Hold to record"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: recording ? "var(--red-soft)" : "var(--surface)",
            color: recording ? "var(--red)" : "var(--text-muted)",
            fontSize: "18px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s",
            flexShrink: 0,
            opacity: transcribing ? 0.5 : 1,
          }}
        >
          {recording ? "⏹" : "🎙️"}
        </button>

        {/* Send Button */}
        <button
          onClick={sendMessage}
          disabled={loading || transcribing}
          style={{
            padding: "12px 20px",
            borderRadius: "10px",
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            opacity: loading || transcribing ? 0.5 : 1,
            fontFamily: "inherit",
            transition: "opacity 0.15s",
          }}
        >
          Send
        </button>
      </div>

      {/* Recording indicator */}
      {recording && (
        <p
          style={{
            fontSize: "12px",
            color: "var(--red)",
            marginTop: "8px",
            textAlign: "center",
          }}
        >
          🔴 Recording... release to stop
        </p>
      )}
    </div>
  );
}
