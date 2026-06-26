"use client";
import {
  RiChatSmile2Line,
  RiFlashlightLine,
  RiFileTextLine,
  RiPlayCircleLine,
  RiSparkling2Line,
  RiStickyNoteLine,
  RiUserVoiceLine,
} from "react-icons/ri";
import { WORKFLOW_STEPS } from "@/lib/learning/journey";

export type TabType =
  | "learn"
  | "practice"
  | "review"
  | "interview"
  | "notes"
  | "rag"
  | "live-chat";

type TabDef = {
  id: TabType;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
};

const WORKFLOW_TABS: TabDef[] = WORKFLOW_STEPS.map((step) => ({
  id: step.tab,
  label: step.label,
  Icon:
    step.id === "learn"
      ? RiChatSmile2Line
      : step.id === "practice"
        ? RiFileTextLine
        : step.id === "interview"
          ? RiUserVoiceLine
          : RiSparkling2Line,
}));

const UTILITY_TABS: TabDef[] = [
  { id: "notes", label: "Notes", Icon: RiStickyNoteLine },
  { id: "rag", label: "RAG Chat", Icon: RiFlashlightLine },
  { id: "live-chat", label: "Live Chat", Icon: RiPlayCircleLine },
];

const TABS: TabDef[] = [...WORKFLOW_TABS, ...UTILITY_TABS];

type Props = {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
  showActiveIndicator?: boolean;
};

export default function Tabs({
  activeTab,
  onChange,
  showActiveIndicator = true,
}: Props) {
  return (
    <div className="-mx-4 min-w-0 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
      <div className="flex min-w-max items-center gap-1">
        {TABS.map(({ id, label, Icon }) => {
          const active = showActiveIndicator && activeTab === id;
          const isFirstUtility = id === "notes";

          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`relative flex items-center gap-1.5 px-3 py-3 text-[13px] font-medium whitespace-nowrap transition-colors duration-200 ${
                isFirstUtility ? "ml-1 border-l pl-4 sm:ml-2" : ""
              }`}
              style={{
                color: active ? "var(--text)" : "var(--text-muted)",
                borderColor: isFirstUtility ? "var(--border-strong)" : undefined,
              }}
            >
              <Icon size={14} />
              <span>{label}</span>
              <span
                className="absolute right-0 bottom-0 left-0 h-0.5 rounded-t-full"
                style={{
                  background: active ? "var(--accent)" : "transparent",
                  transform: active ? "scaleX(1)" : "scaleX(0)",
                  transition: "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
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
