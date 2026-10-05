import { Building2 } from "lucide-react";
import { cn } from "../../utils/strings";

export interface OrgAvatarProps {
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export function OrgAvatar({
  name,
  logoUrl,
  size = "md",
  className,
}: OrgAvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-lg bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200",
        sizes[size],
        className,
      )}
      aria-label={name}
    >
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <Building2 aria-hidden className="h-5 w-5" />
      )}
    </span>
  );
}