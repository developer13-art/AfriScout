import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/strings";

export interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  max?: number;
  label?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

export function TagInput({
  value,
  onChange,
  placeholder = "Type and press Enter",
  max = 30,
  label,
  hint,
  error,
  disabled,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    if (value.includes(tag)) {
      setDraft("");
      return;
    }
    if (value.length >= max) return;
    onChange([...value, tag]);
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(draft);
    } else if (event.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="w-full">
      {label ? (
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          "min-h-[40px] w-full rounded-lg border bg-white p-1.5",
          "focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-600/30",
          error ? "border-red-500" : "border-neutral-300",
          disabled && "bg-neutral-50",
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-teal-200"
            >
              {tag}
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => onChange(value.filter((item) => item !== tag))}
                  aria-label={`Remove ${tag}`}
                  className="rounded-full p-0.5 hover:bg-teal-100"
                >
                  <X aria-hidden className="h-3 w-3" />
                </button>
              ) : null}
            </span>
          ))}
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => addTag(draft)}
            disabled={disabled}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[140px] bg-transparent px-1 py-1 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
          />
        </div>
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
}