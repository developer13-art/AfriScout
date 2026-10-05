export function truncate(value: string, max: number, suffix = "..."): string {
  if (value.length <= max) return value;
  return value.slice(0, Math.max(0, max - suffix.length)).trimEnd() + suffix;
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}