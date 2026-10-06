import { currencySymbol } from "../config/currencies";

export function formatCurrency(
  amount: number | null | undefined,
  currency = "USD",
  options: { compact?: boolean; showCode?: boolean } = {},
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "";
  }

  const { compact = false, showCode = false } = options;

  const formatted = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: compact ? 1 : 2,
    minimumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(amount);

  return showCode ? `${formatted} ${currency}` : formatted;
}

export function formatCurrencyRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency = "USD",
  options: { compact?: boolean } = {},
): string {
  if ((min === null || min === undefined) && (max === null || max === undefined)) {
    return "";
  }
  const minText = min !== null && min !== undefined
    ? formatCurrency(min, currency, options)
    : "";
  const maxText = max !== null && max !== undefined
    ? formatCurrency(max, currency, options)
    : "";
  if (minText && maxText && minText !== maxText) return `${minText} - ${maxText}`;
  return minText || maxText;
}

export function formatCurrencySymbol(code: string): string {
  return currencySymbol(code);
}