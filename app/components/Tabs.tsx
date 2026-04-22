"use client";
import {
  RiChatSmile2Line,
  RiFileTextLine,
  RiSparkling2Line,
  RiStickyNoteLine,
  RiFlashlightLine,
  RiPlayCircleLine,
} from "react-icons/ri";

export type TabType =
  | "chat"
  | "quiz"
  | "summary"
  | "notes"
  | "rag"
  | "live-chat";

type TabDef = {
  id: TabType;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
};

const TABS: TabDef[] = [
  { id: "chat", label: "Chat", Icon: RiChatSmile2Line },
  { id: "quiz", label: "Quiz", Icon: RiFileTextLine },
  { id: "summary", label: "Summary", Icon: RiSparkling2Line },
  { id: "notes", label: "Notes", Icon: RiStickyNoteLine },
  { id: "rag", label: "RAG Chat", Icon: RiFlashlightLine },
  { id: "live-chat", label: "Live Chat", Icon: RiPlayCircleLine },
];

type Props = {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
};

export default function Tabs({ activeTab, onChange }: Props) {
  return (
    <div className="-mx-4 min-w-0 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
      <div className="flex min-w-max items-center gap-1">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="relative flex items-center gap-1.5 px-3 py-3 text-[13px] font-medium whitespace-nowrap transition-colors duration-150"
              style={{ color: active ? "var(--text)" : "var(--text-muted)" }}
            >
              <Icon size={14} />
              <span>{label}</span>
              <span
                className="absolute right-0 bottom-0 left-0 h-0.5 rounded-t-full"
                style={{
                  background: active ? "var(--accent)" : "transparent",
                  transform: active ? "scaleX(1)" : "scaleX(0)",
                  transition: "transform 0.18s ease",
                  transformOrigin: "center",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
