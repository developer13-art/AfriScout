import { Link } from "react-router-dom";
import { Card, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Sparkles, ArrowRight } from "lucide-react";
import type { Opportunity } from "../../types/opportunity";
import { MatchScoreBadge } from "../matching/MatchScoreBadge";

export interface RecentMatch {
  opportunity: Opportunity;
  score: number;
}

export interface RecentMatchesProps {
  matches: RecentMatch[];
}

export function RecentMatches({ matches }: RecentMatchesProps) {
  return (
    <Card>
      <CardHeader
        title="Top matches"
        actions={
          <Link
            to="/matches"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />
      {matches.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          title="No matches yet"
          description="Complete your Business DNA to start receiving matches."
        />
      ) : (
        <ul className="divide-y divide-neutral-100">
          {matches.slice(0, 5).map(({ opportunity, score }) => (
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
                    {opportunity.organizationName ?? ""}
                  </p>
                </div>
                <MatchScoreBadge score={score} size="sm" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}