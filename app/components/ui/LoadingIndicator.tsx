type LoadingIndicatorProps = {
  label?: string;
  className?: string;
};

export default function LoadingIndicator({
  label = "Loading…",
  className = "",
}: LoadingIndicatorProps) {
  return (
    <p className={`text-[12px] text-muted ${className}`.trim()}>{label}</p>
  );
}
