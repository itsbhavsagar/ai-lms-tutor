import type { ButtonHTMLAttributes, ReactNode } from "react";
import { btnPrimaryClass } from "@/lib/ui/styles";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  fullWidth?: boolean;
};

export default function PrimaryButton({
  children,
  fullWidth = false,
  className = "",
  style,
  disabled,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${btnPrimaryClass} ${fullWidth ? "w-full sm:w-auto" : ""} ${className}`}
      style={{
        background: "var(--accent)",
        color: "var(--on-accent)",
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
