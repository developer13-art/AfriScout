import { Link } from "react-router-dom";
import { cn } from "../../utils/strings";

export interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  to?: string;
  className?: string;
}

const sizes = {
  sm: "h-6 w-6 text-sm",
  md: "h-8 w-8 text-base",
  lg: "h-10 w-10 text-lg",
};

export function AppLogo({
  size = "md",
  withText = true,
  to,
  className,
}: AppLogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-secondary-500 font-bold text-white",
          sizes[size],
        )}
        aria-hidden
      >
        S
      </span>
      {withText ? (
        <span className="flex flex-col text-sm font-semibold leading-tight text-neutral-900">
          <span>Scout</span>
          <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-neutral-500">
            Opportunity network
          </span>
        </span>
      ) : null}
    </span>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex" aria-label="Scout home">
        {content}
      </Link>
    );
  }

  return content;
}