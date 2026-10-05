export function extractValues(text: string): number[] {
  const matches = text.match(/\b\d{1,3}(?:[,\s]\d{3})+(?:\.\d+)?\b/g) ?? [];
  return matches
    .map((match) => Number(match.replace(/[,\s]/g, "")))
    .filter((value) => Number.isFinite(value));
}