type GeneratingIndicatorProps = {
  label?: string;
  layout?: "centered" | "inline";
};

function ThinkingBars({ className }: { className: string }) {
  return (
    <span className={className} aria-hidden>
      <span className="thinking-bar thinking-bar-1" />
      <span className="thinking-bar thinking-bar-2" />
      <span className="thinking-bar thinking-bar-3" />
    </span>
  );
}

export default function GeneratingIndicator({
  label = "Generating…",
  layout = "centered",
}: GeneratingIndicatorProps) {
  if (layout === "inline") {
    return (
      <div className="flex items-center gap-2.5 py-0.5">
        <ThinkingBars className="flex items-center gap-1" />
        <span className="thinking-shimmer text-[11px] font-medium tracking-wide text-muted">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="generating-indicator" role="status" aria-live="polite">
      <ThinkingBars className="generating-indicator-bars" />
      <p className="generating-indicator-label">{label}</p>
    </div>
  );
}
