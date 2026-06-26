"use client";

import { RiGithubFill } from "react-icons/ri";

const GITHUB_URL = "https://github.com/itsbhavsagar/ai-lms-tutor";

export default function SidebarFooter() {
  return (
    <footer className="flex-none border-t border-(--sidebar-border) px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
      <p className="mb-3 font-mono text-[10px] leading-relaxed text-(--text-sidebar) opacity-45">
        Next.js · Groq · Cohere · Neon · Prisma
      </p>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-(--text-sidebar) opacity-70 transition-opacity hover:opacity-100"
      >
        <RiGithubFill size={13} />
        Built by Bhavsagar
      </a>
    </footer>
  );
}
