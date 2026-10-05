export function extractLocation(text: string): string | null {
  const patterns = [
    /\b(?:Location|Venue|Place)\s*[:\-]\s*([^\n]{3,80})/i,
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}),\s+(Nigeria|Kenya|Ghana|South Africa|Egypt|Rwanda|Tanzania|Uganda|Morocco|Senegal)\b/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1]!.trim();
  }
  return null;
}