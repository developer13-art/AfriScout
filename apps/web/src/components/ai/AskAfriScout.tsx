import { useState, type FormEvent } from "react";
import { Search, Sparkles } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { AiDisclaimer } from "./AiDisclaimer";

export interface AskAfriScoutProps {
  onSubmit: (query: string) => void | Promise<void>;
  loading?: boolean;
  placeholder?: string;
  suggestions?: string[];
}

export function AskAfriScout({
  onSubmit,
  loading,
  placeholder = "Ask AfriScout about opportunities",
  suggestions = [
    "Construction opportunities in Kaduna closing this month",
    "Grants for African fintech startups",
    "Scholarships for software engineering students",
    "Remote software engineering jobs",
  ],
}: AskAfriScoutProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    await onSubmit(query.trim());
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <Input
          className="flex-1"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
        <Button type="submit" loading={loading} leftIcon={<Sparkles className="h-4 w-4" />}>
          Ask
        </Button>
      </form>
      {suggestions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuery(suggestion)}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-3">
        <AiDisclaimer variant="inline" />
      </div>
    </div>
  );
}