import { Link } from "react-router-dom";
import { MapPin, Calendar, Building2, Sparkles } from "lucide-react";
import type { Opportunity } from "../../types/opportunity";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { SourceAttributionBadge } from "../common/SourceAttributionBadge";
import { DeadlineBadge } from "../common/DeadlineBadge";
import { MatchScoreBadge } from "../matching/MatchScoreBadge";
import { labelForCategory } from "../../config/categories";
import { countryName } from "../../config/countries";
import { formatCurrencyRange } from "../../utils/formatCurrency";
import { truncate } from "../../utils/strings";

export interface OpportunityCardProps {
  opportunity: Opportunity;
  matchScore?: number;
  matchReasons?: string[];
  onSave?: () => void;
  saved?: boolean;
  compact?: boolean;
}

export function OpportunityCard({
  opportunity,
  matchScore,
  matchReasons,
  onSave,
  saved,
  compact,
}: OpportunityCardProps) {
  const value = formatCurrencyRange(
    opportunity.valueMin,
    opportunity.valueMax,
    opportunity.currency ?? "USD",
    { compact: true },
  );

  return (
    <Card padding={compact ? "sm" : "md"} className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
            <Building2 aria-hidden className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <Link
              to={`/opportunities/${opportunity.slug}`}
              className="line-clamp-2 text-sm font-semibold text-neutral-900 hover:text-primary-700"
            >
              {opportunity.title}
            </Link>
            <p className="mt-0.5 text-xs text-neutral-500 truncate">
              {opportunity.organizationName ?? "Unknown organization"}
            </p>
          </div>
        </div>
        {typeof matchScore === "number" ? (
          <MatchScoreBadge score={matchScore} />
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
        <Badge tone="primary">{labelForCategory(opportunity.category)}</Badge>
        {opportunity.countryCode ? (
          <span className="inline-flex items-center gap-1">
            <MapPin aria-hidden className="h-3.5 w-3.5" />
            {countryName(opportunity.countryCode)}
            {opportunity.city ? `, ${opportunity.city}` : ""}
          </span>
        ) : null}
        {opportunity.deadline ? (
          <span className="inline-flex items-center gap-1">
            <Calendar aria-hidden className="h-3.5 w-3.5" />
            <DeadlineBadge deadline={opportunity.deadline} />
          </span>
        ) : null}
        {value ? (
          <span className="font-medium text-neutral-700">{value}</span>
        ) : null}
      </div>

      {opportunity.summaryShort || opportunity.description ? (
        <p className="mt-3 line-clamp-2 text-xs text-neutral-600">
          {truncate(
            opportunity.summaryShort ?? opportunity.description ?? "",
            220,
          )}
        </p>
      ) : null}

      {matchReasons && matchReasons.length > 0 ? (
        <div className="mt-3 rounded-md bg-teal-50/60 px-2.5 py-2 ring-1 ring-teal-100">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-teal-700">
            <Sparkles aria-hidden className="h-3 w-3" />
            Why this matches you
          </p>
          <ul className="mt-1 space-y-0.5">
            {matchReasons.slice(0, 3).map((reason) => (
              <li key={reason} className="text-[11px] text-teal-800">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <SourceAttributionBadge sourceName={opportunity.organizationName ?? undefined} />
        <div className="flex items-center gap-2">
          {onSave ? (
            <Button variant="outline" size="sm" onClick={onSave}>
              {saved ? "Saved" : "Save"}
            </Button>
          ) : null}
          <Link to={`/opportunities/${opportunity.slug}`}>
            <Button size="sm">View details</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}