export function extractValue(text: string): string {
  const patterns = [
    /(?:value|budget|amount|contract sum)[:\-]\s*([^\n]{3,120})/i,
    /(?:USD|EUR|GBP|NGN|KES|ZAR|GHS)\s?\d[\d,.\s]*/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0]!.trim();
  }
  return "";
}