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
import {
  tabBtnActiveClass,
  tabBtnClass,
  tabBtnInactiveClass,
  tabIndicatorClass,
  tabsScrollClass,
  tabsScrollClipClass,
} from "@/lib/ui/styles";

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
  Icon: React.ComponentType<{ size?: number; className?: string }>;
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
  trailing?: React.ReactNode;
};

export default function Tabs({
  activeTab,
  onChange,
  showActiveIndicator = true,
  trailing,
}: Props) {
  return (
    <div className="-mx-4 min-w-0 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
      <div className="flex min-w-0 items-center gap-2">
        <div className={tabsScrollClipClass}>
          <div className={`${tabsScrollClass} flex min-w-max items-center gap-1`}>
        {TABS.map(({ id, label, Icon }) => {
          const active = showActiveIndicator && activeTab === id;
          const isFirstUtility = id === "notes";

          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`${tabBtnClass} ${
                active ? tabBtnActiveClass : tabBtnInactiveClass
              } ${isFirstUtility ? "ml-1 border-l border-border-strong pl-4 sm:ml-2" : ""}`}
            >
              <Icon size={14} />
              <span>{label}</span>
              <span
                className={`${tabIndicatorClass} ${
                  active ? "scale-x-100" : "scale-x-0 bg-transparent"
                }`}
              />
            </button>
          );
        })}
          </div>
        </div>
        {trailing}
      </div>
    </div>
  );
}
