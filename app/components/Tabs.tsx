"use client";
export type TabType = "chat" | "quiz" | "summary" | "notes" | "rag" | "demo";

type Props = { activeTab: TabType; onChange: (tab: TabType) => void };

const tabs: { id: TabType; label: string }[] = [
  { id: "chat", label: "💬 Chat" },
  { id: "quiz", label: "📝 Quiz" },
  { id: "summary", label: "📄 Summary" },
  { id: "notes", label: "🗒️ Notes" },
  { id: "rag", label: "⚡ RAG Chat" },
  { id: "demo", label: "⚡ Demo Chat" },
];

export default function Tabs({ activeTab, onChange }: Props) {
  return (
    <div className="tabs-container">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: activeTab === tab.id ? 600 : 400,
            color: activeTab === tab.id ? "var(--accent)" : "var(--text-muted)",
            background: "transparent",
            border: "none",
            borderBottom:
              activeTab === tab.id
                ? "2px solid var(--accent)"
                : "2px solid transparent",
            marginBottom: "-1px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            fontFamily: "inherit",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
