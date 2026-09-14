import { Link } from "react-router-dom";
import { MapPin, Calendar } from "lucide-react";
import type { Opportunity } from "../../types/opportunity";
import { Badge } from "../ui/Badge";
import { MatchScoreBadge } from "../matching/MatchScoreBadge";
import { DeadlineBadge } from "../common/DeadlineBadge";
import { labelForCategory } from "../../config/categories";
import { countryName } from "../../config/countries";

export interface OpportunityCompactRowProps {
  opportunity: Opportunity;
  matchScore?: number;
}

export function OpportunityCompactRow({
  opportunity,
  matchScore,
}: OpportunityCompactRowProps) {
  return (
    <Link
      to={`/opportunities/${opportunity.slug}`}
      className="flex items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-neutral-50"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-900 line-clamp-1">
          {opportunity.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <Badge tone="primary">{labelForCategory(opportunity.category)}</Badge>
          {opportunity.countryCode ? (
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden className="h-3 w-3" />
              {countryName(opportunity.countryCode)}
            </span>
          ) : null}
          {opportunity.deadline ? (
            <span className="inline-flex items-center gap-1">
              <Calendar aria-hidden className="h-3 w-3" />
              <DeadlineBadge deadline={opportunity.deadline} />
            </span>
          ) : null}
        </div>
      </div>
      {typeof matchScore === "number" ? (
        <MatchScoreBadge score={matchScore} size="sm" />
      ) : null}
    </Link>
  );
}