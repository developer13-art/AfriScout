export function nowIso(): string {
  return new Date().toISOString();
}

export function toIsoOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value as never);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function isExpired(deadline: string | Date | null | undefined): boolean {
  if (!deadline) return false;
  const date = deadline instanceof Date ? deadline : new Date(deadline);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}