import { Calendar, AlertTriangle } from "lucide-react";
import type { Opportunity } from "../../types/opportunity";
import { Timeline, type TimelineItem } from "../ui/Timeline";
import { formatDate } from "../../utils/formatDate";

export interface OpportunityTimelineProps {
  opportunity: Opportunity;
}

export function OpportunityTimeline({ opportunity }: OpportunityTimelineProps) {
  const items: TimelineItem[] = [];

  if (opportunity.publishedAt) {
    items.push({
      id: "published",
      title: "Published",
      description: `Opportunity first published on ${formatDate(opportunity.publishedAt)}`,
      icon: <Calendar className="h-3.5 w-3.5" />,
      tone: "primary",
      timestamp: formatDate(opportunity.publishedAt),
    });
  }

  if (opportunity.deadline) {
    items.push({
      id: "deadline",
      title: "Deadline",
      description: `Applications close on ${formatDate(opportunity.deadline)}`,
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      tone: "warning",
      timestamp: formatDate(opportunity.deadline),
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">No timeline information.</p>;
  }

  return <Timeline items={items} />;
}