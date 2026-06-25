import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Smaller padding — use in sidebars and narrow panels */
  compact?: boolean;
  /** Fill remaining vertical space — use in main tab content areas */
  fill?: boolean;
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
  style,
  compact = false,
  fill = false,
}: EmptyStateProps) {
  return (
    <div
      className={`empty-state flex flex-col items-center justify-center gap-3 px-4 text-center ${
        compact ? "py-6" : "py-10 sm:py-14"
      } ${fill ? "min-h-0 flex-1" : ""} ${className}`}
      style={style}
    >
      <div
        className="empty-state-icon flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{
          background: "var(--accent-soft)",
          color: "var(--accent)",
        }}
      >
        {icon}
      </div>
      <div className="max-w-sm space-y-1.5">
        <p
          className="text-[14px] font-semibold tracking-tight"
          style={{ color: "var(--text)" }}
        >
          {title}
        </p>
        {description && (
          <p
            className="text-[12px] leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
