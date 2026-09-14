export function trigrams(value: string): Set<string> {
  const cleaned = value.replace(/\s+/g, " ").trim();
  const grams = new Set<string>();
  for (let i = 0; i < cleaned.length - 2; i += 1) {
    grams.add(cleaned.slice(i, i + 3));
  }
  return grams;
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function computeTitleSimilarity(a: string, b: string): number {
  const gramsA = trigrams(a);
  const gramsB = trigrams(b);
  return jaccardSimilarity(gramsA, gramsB);
}

export function titleMatchPercentage(a: string, b: string): number {
  return Math.round(computeTitleSimilarity(a.toLowerCase(), b.toLowerCase()) * 100);
}