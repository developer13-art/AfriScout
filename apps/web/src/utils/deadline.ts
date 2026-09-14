import { differenceInCalendarDays } from "date-fns";
import { isPast } from "./formatDate";

export type DeadlineUrgency =
  | "expired"
  | "today"
  | "urgent"
  | "soon"
  | "later"
  | "unknown";

export function deadlineUrgency(
  value: string | Date | null | undefined,
): DeadlineUrgency {
  if (!value) return "unknown";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  if (isPast(date)) return "expired";
  const days = differenceInCalendarDays(date, new Date());
  if (days === 0) return "today";
  if (days <= 3) return "urgent";
  if (days <= 14) return "soon";
  return "later";
}

export function daysUntil(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return differenceInCalendarDays(date, new Date());
}

export function deadlineLabel(value: string | Date | null | undefined): string {
  const days = daysUntil(value);
  if (days === null) return "";
  if (days < 0) return "Expired";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}