import { ExternalLink, ShieldCheck } from "lucide-react";
import { cn } from "../../utils/strings";

export interface SourceAttributionBadgeProps {
  sourceName?: string;
  sourceUrl?: string;
  verified?: boolean;
  className?: string;
}

export function SourceAttributionBadge({
  sourceName,
  sourceUrl,
  verified,
  className,
}: SourceAttributionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 truncate text-[11px] text-neutral-500",
        className,
      )}
    >
      {verified ? (
        <ShieldCheck aria-hidden className="h-3.5 w-3.5 text-emerald-600" />
      ) : null}
      <span className="truncate">
        Source: {sourceName ?? "Unknown"}
      </span>
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary-700 hover:underline"
        >
          Open
          <ExternalLink aria-hidden className="h-3 w-3" />
        </a>
      ) : null}
    </span>
  );
}