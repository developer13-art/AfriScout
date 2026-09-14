import type { Opportunity } from "../../types/opportunity";
import { Badge } from "../ui/Badge";
import { MatchScoreBadge } from "../matching/MatchScoreBadge";
import { DeadlineBadge } from "../common/DeadlineBadge";
import { SourceAttributionBadge } from "../common/SourceAttributionBadge";
import { Building2, MapPin, Globe } from "lucide-react";
import { countryName } from "../../config/countries";
import { labelForCategory, labelForOpportunityType } from "../../config/categories";
import { formatCurrencyRange } from "../../utils/formatCurrency";

export interface OpportunityDetailHeaderProps {
  opportunity: Opportunity;
  matchScore?: number;
}

export function OpportunityDetailHeader({
  opportunity,
  matchScore,
}: OpportunityDetailHeaderProps) {
  const value = formatCurrencyRange(
    opportunity.valueMin,
    opportunity.valueMax,
    opportunity.currency ?? "USD",
    { compact: true },
  );

  return (
    <header className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">{labelForCategory(opportunity.category)}</Badge>
            <Badge tone="neutral">{labelForOpportunityType(opportunity.opportunityType)}</Badge>
            {opportunity.verificationStatus === "VERIFIED" ? (
              <Badge tone="success">Verified</Badge>
            ) : null}
          </div>
          <h1 className="mt-3 text-xl font-semibold text-neutral-900 sm:text-2xl">
            {opportunity.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-neutral-600">
            {opportunity.organizationName ? (
              <span className="inline-flex items-center gap-1.5">
                <Building2 aria-hidden className="h-4 w-4" />
                {opportunity.organizationName}
              </span>
            ) : null}
            {opportunity.countryCode ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden className="h-4 w-4" />
                {countryName(opportunity.countryCode)}
                {opportunity.city ? `, ${opportunity.city}` : ""}
              </span>
            ) : null}
            {opportunity.isRemote ? (
              <span className="inline-flex items-center gap-1.5">
                <Globe aria-hidden className="h-4 w-4" />
                Remote
              </span>
            ) : null}
            {opportunity.deadline ? (
              <DeadlineBadge deadline={opportunity.deadline} />
            ) : null}
            {value ? <span className="font-medium text-neutral-700">{value}</span> : null}
          </div>
        </div>
        {typeof matchScore === "number" ? (
          <div className="shrink-0">
            <MatchScoreBadge score={matchScore} size="lg" />
          </div>
        ) : null}
      </div>

      {opportunity.applicationUrl ? (
        <div className="mt-4">
          <SourceAttributionBadge
            sourceUrl={opportunity.applicationUrl}
            sourceName={opportunity.organizationName ?? undefined}
          />
        </div>
      ) : null}
    </header>
  );
}