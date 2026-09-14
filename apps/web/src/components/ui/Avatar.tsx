import { useState } from "react";
import { cn } from "../../utils/strings";
import { initials } from "../../utils/strings";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizes: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export function Avatar({ src, alt, name, size = "md", className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;
  const label = (name ?? alt ?? "").trim();

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200",
        sizes[size],
        className,
      )}
      aria-label={label || undefined}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt ?? label}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-semibold">{label ? initials(label) : "?"}</span>
      )}
    </span>
  );
}