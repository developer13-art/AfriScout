export function parseCurrency(input: string | null | undefined): string | null {
  if (!input) return null;
  const upper = input.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(upper)) return upper;
  if (upper.includes("NAIRA")) return "NGN";
  if (upper.includes("SHILLING")) return "KES";
  if (upper.includes("RAND")) return "ZAR";
  if (upper.includes("CEDIS") || upper.includes("CEDI")) return "GHS";
  if (upper.includes("DOLLAR") || upper.includes("USD")) return "USD";
  if (upper.includes("EURO") || upper.includes("EUR")) return "EUR";
  return null;
}