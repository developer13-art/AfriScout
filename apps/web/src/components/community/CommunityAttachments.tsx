import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import type { CommunityAttachment } from "../../services/media.service";
import { mediaService } from "../../services/media.service";

function AttachmentItem({ attachment }: { attachment: CommunityAttachment }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    void mediaService.downloadAttachment(attachment.id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.id]);

  if (attachment.mimeType.startsWith("image/")) {
    return (
      <div className="mt-3">
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" aria-label={`Open ${attachment.filename}`}>
            <img src={url} alt={attachment.filename} loading="lazy" className="max-h-80 max-w-full rounded-xl border border-neutral-200 object-contain" />
          </a>
        ) : (
          <span className="text-xs text-neutral-500">{failed ? "Image unavailable" : "Loading image…"}</span>
        )}
      </div>
    );
  }

  return (
    <a
      href={url ?? undefined}
      download={attachment.filename}
      aria-disabled={!url}
      className="mt-2 inline-flex max-w-full items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-primary-700 hover:bg-primary-50 aria-disabled:pointer-events-none aria-disabled:opacity-50"
    >
      {failed ? <FileText aria-hidden className="h-4 w-4 shrink-0" /> : <Download aria-hidden className="h-4 w-4 shrink-0" />}
      <span className="max-w-64 truncate">{failed ? "File unavailable" : attachment.filename}</span>
      {!url && !failed ? <span className="text-xs text-neutral-500">Loading…</span> : null}
    </a>
  );
}

export function CommunityAttachments({ attachments }: { attachments?: CommunityAttachment[] }) {
  if (!attachments?.length) return null;
  return (
    <div className="mt-2 space-y-2">
      {attachments.map((attachment) => <AttachmentItem key={attachment.id} attachment={attachment} />)}
    </div>
  );
}
