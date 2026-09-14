export function formatNumber(
  value: number | null | undefined,
  options: { compact?: boolean; fractionDigits?: number } = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  const { compact = false, fractionDigits } = options;
  return new Intl.NumberFormat("en", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: fractionDigits ?? (compact ? 1 : 2),
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(
  value: number | null | undefined,
  fractionDigits = 0,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return new Intl.NumberFormat("en", {
    style: "percent",
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}