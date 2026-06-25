type LoadingIndicatorProps = {
  label?: string;
  className?: string;
};

export default function LoadingIndicator({
  label,
  className = "",
}: LoadingIndicatorProps) {
  return (
    <div
      className={`flex items-center justify-center gap-2.5 ${className}`}
      style={{ color: "var(--text-muted)" }}
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-1">
        <span className="dot dot-1" />
        <span className="dot dot-2" />
        <span className="dot dot-3" />
      </span>
      {label && <span className="text-[12px] font-medium">{label}</span>}
    </div>
  );
}
