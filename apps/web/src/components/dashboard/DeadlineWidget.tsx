import { Link } from "react-router-dom";
import { Card, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Calendar, ArrowRight } from "lucide-react";
import type { Opportunity } from "../../types/opportunity";
import { DeadlineBadge } from "../common/DeadlineBadge";
import { countryName } from "../../config/countries";

export interface DeadlineWidgetProps {
  opportunities: Opportunity[];
  title?: string;
}

export function DeadlineWidget({
  opportunities,
  title = "Closing soon",
}: DeadlineWidgetProps) {
  return (
    <Card>
      <CardHeader title={title} />
      {opportunities.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-5 w-5" />}
          title="Nothing closing soon"
          description="Opportunities with upcoming deadlines will appear here."
        />
      ) : (
        <ul className="divide-y divide-neutral-100">
          {opportunities.map((opportunity) => (
            <li key={opportunity.id}>
              <Link
                to={`/opportunities/${opportunity.slug}`}
                className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0 group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-800 line-clamp-2 group-hover:text-primary-700">
                    {opportunity.title}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {opportunity.countryCode
                      ? countryName(opportunity.countryCode)
                      : "-"}
                  </p>
                </div>
                <span className="shrink-0">
                  {opportunity.deadline ? (
                    <DeadlineBadge deadline={opportunity.deadline} />
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3">
        <Link
          to="/pipeline"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
        >
          View pipeline <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </Card>
  );
}