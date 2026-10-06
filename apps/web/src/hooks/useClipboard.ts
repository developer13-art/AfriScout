import { useCallback, useState } from "react";
import { copyToClipboard } from "../utils/clipboard";

export function useClipboard(timeoutMs = 1500) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (value: string) => {
      const ok = await copyToClipboard(value);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), timeoutMs);
      }
      return ok;
    },
    [timeoutMs],
  );

  return { copied, copy };
}