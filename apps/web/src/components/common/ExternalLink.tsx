import { ExternalLink as ExternalIcon } from "lucide-react";
import { cn } from "../../utils/strings";

export interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function ExternalLink({ href, children, className }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-primary-700 hover:underline",
        className,
      )}
    >
      {children}
      <ExternalIcon aria-hidden className="h-3.5 w-3.5" />
    </a>
  );
}