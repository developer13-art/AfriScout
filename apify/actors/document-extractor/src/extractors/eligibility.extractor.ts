export function extractEligibility(text: string): string {
  const match = text.match(/(?:eligibility|eligible|who can apply)[:\-]\s*([^.]{10,500})/i);
  return match ? match[1]!.trim() : "";
}