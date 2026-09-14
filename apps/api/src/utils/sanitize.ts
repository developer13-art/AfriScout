export function sanitizeString(value: unknown, maxLength = 10000): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (str.length === 0) return null;
  return str.slice(0, maxLength);
}

export function sanitizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num;
}

export function sanitizeStringArray(value: unknown, maxItems = 100, maxLength = 200): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  for (const item of value) {
    const sanitized = sanitizeString(item, maxLength);
    if (sanitized) result.push(sanitized);
    if (result.length >= maxItems) break;
  }
  return result;
}

export function sanitizeHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/javascript:/gi, "");
}