import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "../../utils/strings";
import { copyToClipboard } from "../../utils/clipboard";

export interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export function CopyButton({ value, label = "Copy", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100",
        className,
      )}
      aria-label={label}
    >
      {copied ? (
        <>
          <Check aria-hidden className="h-3.5 w-3.5 text-emerald-600" />
          Copied
        </>
      ) : (
        <>
          <Copy aria-hidden className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </button>
  );
}