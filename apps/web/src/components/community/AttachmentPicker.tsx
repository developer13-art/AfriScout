import { useRef, useState } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { mediaService, type CommunityAttachment } from "../../services/media.service";

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

interface AttachmentPickerProps {
  value: CommunityAttachment[];
  onChange: (attachments: CommunityAttachment[]) => void;
  disabled?: boolean;
}

function readableSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentPicker({ value, onChange, disabled }: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    if (value.length + selected.length > MAX_FILES) {
      setError(`Attach up to ${MAX_FILES} files.`);
      return;
    }
    const oversized = selected.find((file) => file.size > MAX_FILE_BYTES);
    if (oversized) {
      setError(`${oversized.name} is larger than 10 MB.`);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const uploaded = await Promise.all(selected.map((file) => mediaService.uploadAttachment(file)));
      onChange([...value, ...uploaded]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The file upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,application/pdf,text/plain,text/csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        className="sr-only"
        disabled={disabled || uploading || value.length >= MAX_FILES}
        onChange={(event) => void addFiles(event.currentTarget.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading || value.length >= MAX_FILES}
        className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Paperclip aria-hidden className="h-4 w-4" />
        {uploading ? "Uploading…" : "Attach image or file"}
      </button>
      <span className="ml-2 text-xs text-neutral-500">Up to 5 files, 10 MB each</span>
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((attachment) => (
            <li key={attachment.id} className="inline-flex max-w-full items-center gap-2 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs text-neutral-700">
              <FileText aria-hidden className="h-3.5 w-3.5 shrink-0" />
              <span className="max-w-48 truncate">{attachment.filename}</span>
              <span className="shrink-0 text-neutral-500">{readableSize(attachment.size)}</span>
              <button
                type="button"
                aria-label={`Remove ${attachment.filename}`}
                onClick={() => onChange(value.filter((item) => item.id !== attachment.id))}
                className="rounded p-0.5 hover:bg-neutral-200"
                disabled={disabled || uploading}
              >
                <X aria-hidden className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p role="alert" className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
