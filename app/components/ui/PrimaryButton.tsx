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
  disabled,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${btnPrimaryClass} ${fullWidth ? "w-full sm:w-auto" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
