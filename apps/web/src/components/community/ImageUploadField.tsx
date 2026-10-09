import { useEffect, useState } from "react";
import { FileUpload } from "../ui/FileUpload";
import { SafeImage } from "../ui/SafeImage";
import { mediaService } from "../../services/media.service";

interface ImageUploadFieldProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void | Promise<void>;
  hint?: string;
  onUploadingChange?: (uploading: boolean) => void;
}

export function ImageUploadField({ label, value, onChange, hint, onUploadingChange }: ImageUploadFieldProps) {
  const [displayUrl, setDisplayUrl] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setDisplayUrl(value), [value]);

  const upload = async (file: File) => {
    setError(null);
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const url = await mediaService.uploadImage(file);
      await onChange(url);
      setDisplayUrl(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const remove = async () => {
    setError(null);
    try {
      await onChange(null);
      setDisplayUrl(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove this image.");
    }
  };

  return (
    <div className="grid min-w-0 gap-2 text-sm font-medium text-neutral-700">
      <span>{label}</span>
      {displayUrl ? (
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
            <SafeImage
              src={displayUrl}
              alt={`${label} preview`}
              className="h-full w-full object-cover"
              fallback={<span className="px-1 text-center text-[10px] text-neutral-500">Preview unavailable</span>}
              fallbackClassName="grid h-full w-full place-items-center"
            />
          </div>
          <button type="button" onClick={() => void remove()} disabled={uploading} className="text-xs font-semibold text-primary-700 hover:underline">
            Remove image
          </button>
        </div>
      ) : null}
      <FileUpload
        accept="image/png,image/jpeg,image/webp"
        maxSizeMb={5}
        onFiles={(files) => { const file = files[0]; if (file) void upload(file); }}
        label={uploading ? "Uploading image…" : "Choose an image or drag it here"}
        hint={hint ?? "PNG, JPG, or WebP · up to 5 MB"}
        disabled={uploading}
        error={error ?? undefined}
      />
    </div>
  );
}
