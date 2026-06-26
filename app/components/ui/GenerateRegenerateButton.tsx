import type { IconType } from "react-icons";
import { RiRefreshLine } from "react-icons/ri";
import { LABEL_GENERATING, LABEL_REGENERATE } from "@/lib/ui/labels";
import {
  skeletonButtonCompactClass,
  skeletonButtonFullClass,
} from "@/lib/ui/styles";
import PrimaryButton from "./PrimaryButton";

type GenerateRegenerateButtonProps = {
  loaded: boolean;
  hasContent: boolean;
  generating: boolean;
  generateLabel: string;
  onClick: () => void;
  GenerateIcon: IconType;
  className?: string;
  fullWidth?: boolean;
  iconOnlyOnMobile?: boolean;
  hideLabelWhileGenerating?: boolean;
  skeletonClassName?: string;
};

export default function GenerateRegenerateButton({
  loaded,
  hasContent,
  generating,
  generateLabel,
  onClick,
  GenerateIcon,
  className = "",
  fullWidth = false,
  iconOnlyOnMobile = false,
  hideLabelWhileGenerating = false,
  skeletonClassName,
}: GenerateRegenerateButtonProps) {
  const label = generating
    ? LABEL_GENERATING
    : hasContent
      ? LABEL_REGENERATE
      : generateLabel;

  const Icon = hasContent ? RiRefreshLine : GenerateIcon;
  const skeleton =
    skeletonClassName ??
    (fullWidth ? skeletonButtonFullClass : skeletonButtonCompactClass);

  if (!loaded) {
    return <div className={skeleton} aria-hidden />;
  }

  const showLabel = !generating || !hideLabelWhileGenerating;
  const labelClass = iconOnlyOnMobile ? "max-sm:hidden" : undefined;

  return (
    <PrimaryButton
      onClick={onClick}
      disabled={generating}
      aria-label={label}
      fullWidth={fullWidth}
      className={className}
    >
      <Icon size={14} className={generating ? "animate-spin" : undefined} />
      {showLabel && <span className={labelClass}>{label}</span>}
    </PrimaryButton>
  );
}
