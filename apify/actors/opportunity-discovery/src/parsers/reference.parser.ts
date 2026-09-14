export function parseReference(text: string): string | null {
  const match = text.match(/\b(?:Ref|Reference|No\.?)\s*[:#\-]?\s*([A-Z0-9\-\/]{4,40})/i);
  return match ? match[1]!.trim() : null;
}