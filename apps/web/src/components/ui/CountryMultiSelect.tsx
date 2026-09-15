import { useMemo, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { africanCountries, countryName } from "../../config/countries";
import { cn } from "../../utils/strings";

export interface CountryMultiSelectProps {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  max?: number;
}

export function CountryMultiSelect({
  value,
  onChange,
  label,
  hint,
  error,
  placeholder = "Add a country",
  disabled,
  max = 60,
}: CountryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedSet = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return africanCountries;
    return africanCountries.filter(
      (country) =>
        country.name.toLowerCase().includes(q) ||
        country.code.toLowerCase().includes(q) ||
        country.region.toLowerCase().includes(q),
    );
  }, [query]);

  const toggle = (code: string) => {
    if (selectedSet.has(code)) {
      onChange(value.filter((c) => c !== code));
      return;
    }
    if (value.length >= max) return;
    onChange([...value, code]);
  };

  const remove = (code: string) => {
    onChange(value.filter((c) => c !== code));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !query && value.length > 0) {
      onChange(value.slice(0, -1));
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const onQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    if (!open) setOpen(true);
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
          "flex min-h-[40px] w-full items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5",
          "focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-600/30",
          error ? "border-red-500" : "border-neutral-300",
          disabled && "bg-neutral-50",
        )}
        onClick={() => !disabled && setOpen(true)}
      >
        {value.map((code) => (
          <span
            key={code}
            className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-teal-200"
          >
            {countryName(code)}
            {!disabled ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  remove(code);
                }}
                aria-label={`Remove ${countryName(code)}`}
                className="rounded-full p-0.5 hover:bg-teal-100"
              >
                <X aria-hidden className="h-3 w-3" />
              </button>
            ) : null}
          </span>
        ))}

        <input
          value={query}
          onChange={onQueryChange}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          disabled={disabled}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[140px] flex-1 bg-transparent px-1 py-1 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setOpen((prev) => !prev);
          }}
          disabled={disabled}
          aria-label="Toggle country list"
          className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100"
        >
          <ChevronDown aria-hidden className="h-4 w-4" />
        </button>
      </div>

      {open ? (
        <div className="relative">
          <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white p-1 shadow-lg">
            <div className="flex items-center gap-2 border-b border-neutral-100 px-2 py-1.5">
              <Search aria-hidden className="h-3.5 w-3.5 text-neutral-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country or code"
                className="w-full bg-transparent text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
              />
            </div>

            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-neutral-500">
                No countries match your search.
              </p>
            ) : (
              <ul className="pt-1">
                {filtered.map((country) => {
                  const selected = selectedSet.has(country.code);
                  return (
                    <li key={country.code}>
                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          toggle(country.code);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm",
                          selected
                            ? "bg-teal-50 text-teal-800"
                            : "text-neutral-800 hover:bg-neutral-100",
                        )}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="w-6 shrink-0 text-[11px] font-semibold text-neutral-500">
                            {country.code}
                          </span>
                          <span className="truncate">{country.name}</span>
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {country.region}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
}