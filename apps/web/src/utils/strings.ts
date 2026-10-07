export function truncate(value: string, max: number, suffix = "..."): string {
  if (value.length <= max) return value;
  return value.slice(0, Math.max(0, max - suffix.length)).trimEnd() + suffix;
}

export function initials(value: string): string {
  const parts = value.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("");
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function humanizeEnum(value: string): string {
  return titleCase(value.replace(/_/g, " "));
}

export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  if (count === 1) return singular;
  return plural ?? `${singular}s`;
}

export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}