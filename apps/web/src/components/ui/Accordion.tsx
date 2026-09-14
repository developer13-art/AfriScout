import {
  createContext,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/strings";

type AccordionContextValue = {
  openItems: Set<string>;
  toggle: (id: string) => void;
  collapsible: boolean;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext(): AccordionContextValue {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("Accordion components must be used inside <Accordion>");
  return ctx;
}

export interface AccordionProps {
  children: ReactNode;
  defaultOpen?: string[];
  collapsible?: boolean;
  className?: string;
}

export function Accordion({
  children,
  defaultOpen = [],
  collapsible = true,
  className,
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(defaultOpen));

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (collapsible) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggle, collapsible }}>
      <div className={cn("divide-y divide-neutral-200 border-y border-neutral-200", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps {
  id?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function AccordionItem({
  id,
  title,
  subtitle,
  children,
  disabled,
  className,
}: AccordionItemProps) {
  const generatedId = useId();
  const itemId = id ?? generatedId;
  const { openItems, toggle } = useAccordionContext();
  const open = openItems.has(itemId);

  return (
    <div className={cn("py-3", className)}>
      <button
        type="button"
        onClick={() => !disabled && toggle(itemId)}
        disabled={disabled}
        aria-expanded={open}
        className={cn(
          "flex w-full items-start justify-between gap-4 text-left",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/40 rounded-md px-1 py-2",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <div className="flex-1">
          <div className="text-sm font-semibold text-neutral-900">{title}</div>
          {subtitle ? (
            <div className="text-xs text-neutral-500 mt-0.5">{subtitle}</div>
          ) : null}
        </div>
        <ChevronDown
          aria-hidden
          className={cn(
            "h-4 w-4 flex-shrink-0 text-neutral-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="px-1 pt-2 pb-3 text-sm text-neutral-700 animate-fade-in">
          {children}
        </div>
      ) : null}
    </div>
  );
}