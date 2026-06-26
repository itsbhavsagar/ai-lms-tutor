import type { IconType } from "react-icons";
import {
  RiBookOpenLine,
  RiBrainLine,
  RiBubbleChartLine,
  RiCodeBoxLine,
  RiDatabase2Line,
  RiLinksLine,
  RiMindMap,
  RiPulseLine,
  RiQuillPenLine,
  RiReactjsLine,
  RiRobot2Line,
  RiRouteLine,
  RiServerLine,
  RiShieldKeyholeLine,
  RiSpeedLine,
  RiStackLine,
} from "react-icons/ri";
import type { TrackId } from "./types";

const TRACK_ICONS: Record<TrackId, IconType> = {
  "ai-engineering": RiBrainLine,
  frontend: RiCodeBoxLine,
  backend: RiServerLine,
  "system-design": RiMindMap,
};

const LESSON_ICONS: Record<string, IconType> = {
  "prompt-engineering": RiQuillPenLine,
  rag: RiBookOpenLine,
  embeddings: RiBubbleChartLine,
  "ai-agents": RiRobot2Line,
  "react-fundamentals": RiReactjsLine,
  "react-performance": RiSpeedLine,
  "nextjs-app-router": RiRouteLine,
  "tanstack-query": RiStackLine,
  "rest-api-design": RiLinksLine,
  authentication: RiShieldKeyholeLine,
  postgresql: RiDatabase2Line,
  "system-design-fundamentals": RiMindMap,
  observability: RiPulseLine,
};

const FALLBACK_LESSON_ICON = RiBookOpenLine;

export function getTrackIcon(trackId: TrackId): IconType {
  return TRACK_ICONS[trackId];
}

export function getLessonIcon(lessonId: string): IconType {
  return LESSON_ICONS[lessonId] ?? FALLBACK_LESSON_ICON;
}
