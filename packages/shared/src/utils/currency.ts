export function normalizeCurrencyCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  return upper.length === 3 ? upper : null;
}

export function formatCurrencyAmount(
  amount: number | null | undefined,
  currency = "USD",
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}