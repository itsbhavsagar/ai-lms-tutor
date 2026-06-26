import GeneratingIndicator from "../ui/GeneratingIndicator";

type ChatThinkingIndicatorProps = {
  label?: string;
};

export default function ChatThinkingIndicator({
  label = "Thinking",
}: ChatThinkingIndicatorProps) {
  return <GeneratingIndicator label={label} layout="inline" />;
}
