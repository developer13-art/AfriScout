import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../../utils/strings";
import { normalizeMediaImageUrl } from "../../utils/mediaUrl";

interface SafeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: ReactNode;
  fallbackClassName?: string;
}

export function SafeImage({ src, alt, className, fallback, fallbackClassName }: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return fallback ? (
      <span className={cn(fallbackClassName ?? className)} aria-hidden="true">{fallback}</span>
    ) : null;
  }

  return (
    <img
      src={normalizeMediaImageUrl(src) ?? undefined}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
