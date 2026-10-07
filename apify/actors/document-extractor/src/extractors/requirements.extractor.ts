export function extractRequirements(text: string): string[] {
  const section = text.match(/(?:requirements|required documents|criteria)[:\-]([\s\S]{20,2000})/i);
  if (!section) return [];
  return section[1]!
    .split(/\n|•|\u2022|- /)
    .map((item) => item.trim())
    .filter((item) => item.length > 5 && item.length < 300)
    .slice(0, 40);
}