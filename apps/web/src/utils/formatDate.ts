import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function formatDate(
  value: string | Date | null | undefined,
  pattern = "d MMM yyyy",
): string {
  const date = toDate(value);
  return date ? format(date, pattern) : "";
}

export function formatDateTime(
  value: string | Date | null | undefined,
  pattern = "d MMM yyyy, HH:mm",
): string {
  const date = toDate(value);
  return date ? format(date, pattern) : "";
}

export function formatDateShort(
  value: string | Date | null | undefined,
): string {
  return formatDate(value, "d MMM");
}

export function formatDateLong(
  value: string | Date | null | undefined,
): string {
  return formatDate(value, "d MMMM yyyy");
}

export function formatRelative(
  value: string | Date | null | undefined,
): string {
  const date = toDate(value);
  if (!date) return "";
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function isPast(value: string | Date | null | undefined): boolean {
  const date = toDate(value);
  return date ? date.getTime() < Date.now() : false;
}

export function isFuture(value: string | Date | null | undefined): boolean {
  const date = toDate(value);
  return date ? date.getTime() > Date.now() : false;
}