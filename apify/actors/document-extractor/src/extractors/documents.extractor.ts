export function extractDocuments(text: string): string[] {
  const matches = text.match(/[\w-]+\.(?:pdf|docx?|xlsx?)/gi) ?? [];
  return Array.from(new Set(matches.map((entry) => entry.trim())));
}