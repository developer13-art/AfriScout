export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function ensureUniqueSlug(base: string, suffix: string | number): string {
  const suffixStr = String(suffix).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return `${slugify(base)}-${suffixStr}`;
}