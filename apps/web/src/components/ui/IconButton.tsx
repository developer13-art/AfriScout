import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/strings";

export type IconButtonTone = "default" | "primary" | "danger" | "ghost";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  tone?: IconButtonTone;
  size?: IconButtonSize;
  loading?: boolean;
}

const tones: Record<IconButtonTone, string> = {
  default:
    "bg-white text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-50 focus-visible:ring-primary-600/40",
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-600/40",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600/40",
  ghost:
    "bg-transparent text-neutral-600 hover:bg-neutral-100 focus-visible:ring-primary-600/40",
};

const sizes: Record<IconButtonSize, string> = {
  sm: "h-8 w-8 rounded-md",
  md: "h-10 w-10 rounded-lg",
  lg: "h-12 w-12 rounded-lg",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { icon, label, tone = "default", size = "md", loading, className, disabled, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
          sizes[size],
          tones[tone],
          className,
        )}
        {...rest}
      >
        {loading ? (
          <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
        ) : (
          <span aria-hidden className="h-4 w-4 flex items-center justify-center">
            {icon}
          </span>
        )}
      </button>
    );
  },
);