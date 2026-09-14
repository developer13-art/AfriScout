export function extractDates(html: string): string[] {
  const matches = html.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? [];
  return Array.from(new Set(matches));
}