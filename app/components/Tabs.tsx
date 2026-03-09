"use client";

export type TabType = "chat" | "quiz" | "summary" | "notes";

type Props = {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
};

const tabs: { id: TabType; label: string }[] = [
  { id: "chat", label: "💬 Chat" },
  { id: "quiz", label: "📝 Quiz" },
  { id: "summary", label: "📄 Summary" },
  { id: "notes", label: "🗒️ Notes" },
];

export default function Tabs({ activeTab, onChange }: Props) {
  return (
    <div className="flex gap-2 border-b border-gray-800 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-[2px] ${
            activeTab === tab.id
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
