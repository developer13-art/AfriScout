export function extractDeadline(text: string): string {
  const patterns = [
    /(?:deadline|closing date|due date|submit by)[:\-]\s*([^\n]{4,80})/i,
    /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/,
    /\b\d{4}-\d{2}-\d{2}\b/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1] ?? match[0]!;
  }
  return "";
}