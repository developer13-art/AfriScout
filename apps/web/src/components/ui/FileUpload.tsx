import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "../../utils/strings";

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  onFiles: (files: File[]) => void;
  label?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

export function FileUpload({
  accept,
  multiple,
  maxSizeMb = 20,
  onFiles,
  label = "Click to upload or drag and drop",
  hint,
  error,
  disabled,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setLocalError(null);
    const accepted: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > maxSizeMb * 1024 * 1024) {
        setLocalError(`File ${file.name} exceeds ${maxSizeMb} MB`);
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length > 0) onFiles(accepted);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  };

  const displayedError = error ?? localError ?? undefined;

  return (
    <div className="w-full">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center cursor-pointer",
          "transition-colors",
          dragging
            ? "border-primary-600 bg-teal-50/40"
            : "border-neutral-300 hover:border-neutral-400",
          disabled && "cursor-not-allowed opacity-60",
          displayedError && "border-red-500",
        )}
      >
        <UploadCloud aria-hidden className="h-6 w-6 text-neutral-500" />
        <div className="text-sm font-medium text-neutral-800">{label}</div>
        {hint ? <div className="text-xs text-neutral-500">{hint}</div> : null}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
        />
      </label>
      {displayedError ? (
        <p className="mt-1 text-xs text-red-600">{displayedError}</p>
      ) : null}
    </div>
  );
}