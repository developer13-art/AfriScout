export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function truncate(value: string, max: number, suffix = "..."): string {
  if (value.length <= max) return value;
  return value.slice(0, Math.max(0, max - suffix.length)).trimEnd() + suffix;
}

export function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(capitalize)
    .join(" ");
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

export function includesIgnoreCase(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}