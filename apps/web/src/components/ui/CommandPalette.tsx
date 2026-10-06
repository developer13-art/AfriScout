import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Search } from "lucide-react";
import { cn } from "../../utils/strings";
import { Dialog } from "./Dialog";

interface CommandPaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error("CommandPalette components must be used inside <CommandPaletteProvider>");
  }
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const value = useMemo(() => ({ open, setOpen }), [open]);
  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  group?: string;
  onSelect: () => void;
  keywords?: string[];
}

export interface CommandPaletteProps {
  items: CommandItem[];
  placeholder?: string;
  emptyMessage?: string;
}

export function CommandPalette({
  items,
  placeholder = "Search",
  emptyMessage = "No results",
}: CommandPaletteProps) {
  const { open, setOpen } = useCommandPalette();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const haystack = [item.label, item.description ?? "", ...(item.keywords ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query]);

  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const key = item.group ?? "Results";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} size="md">
      <div className="-m-5">
        <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3">
          <Search aria-hidden className="h-4 w-4 text-neutral-500" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex h-6 items-center rounded border border-neutral-200 bg-neutral-50 px-1.5 text-[10px] font-medium text-neutral-500">
            Esc
          </kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {groups.length === 0 ? (
            <div className="px-4 py-6 text-sm text-neutral-500 text-center">
              {emptyMessage}
            </div>
          ) : (
            groups.map(([group, groupItems]) => (
              <div key={group} className="mb-2">
                <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                  {group}
                </div>
                <ul>
                  {groupItems.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          item.onSelect();
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-2 text-left text-sm",
                          "hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block font-medium text-neutral-900">
                            {item.label}
                          </span>
                          {item.description ? (
                            <span className="block text-xs text-neutral-500 mt-0.5">
                              {item.description}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </Dialog>
  );
}

export function useCommandPaletteTrigger(): () => void {
  const { setOpen } = useCommandPalette();
  return () => setOpen(true);
}   