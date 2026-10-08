import { Link } from "react-router-dom";
import { cn } from "../../utils/strings";

export interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  to?: string;
  className?: string;
}

const sizes = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-11 w-11",
};

export function AppLogo({
  size = "md",
  withText = true,
  to,
  className,
}: AppLogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img
        src="/logo.png"
        alt={withText ? "" : "Scout"}
        className={cn("shrink-0 rounded-lg object-cover", sizes[size])}
      />
      {withText ? (
        <span className="text-sm font-semibold leading-tight text-neutral-900">Scout</span>
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