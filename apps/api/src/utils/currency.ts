export interface CurrencyMeta {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export const CURRENCIES: Record<string, CurrencyMeta> = {
  USD: { code: "USD", name: "US Dollar", symbol: "$", decimals: 2 },
  EUR: { code: "EUR", name: "Euro", symbol: "EUR", decimals: 2 },
  GBP: { code: "GBP", name: "Pound Sterling", symbol: "GBP", decimals: 2 },
  NGN: { code: "NGN", name: "Nigerian Naira", symbol: "NGN", decimals: 2 },
  KES: { code: "KES", name: "Kenyan Shilling", symbol: "KES", decimals: 2 },
  GHS: { code: "GHS", name: "Ghanaian Cedi", symbol: "GHS", decimals: 2 },
  ZAR: { code: "ZAR", name: "South African Rand", symbol: "ZAR", decimals: 2 },
  EGP: { code: "EGP", name: "Egyptian Pound", symbol: "EGP", decimals: 2 },
  MAD: { code: "MAD", name: "Moroccan Dirham", symbol: "MAD", decimals: 2 },
  XOF: { code: "XOF", name: "West African CFA Franc", symbol: "XOF", decimals: 0 },
  XAF: { code: "XAF", name: "Central African CFA Franc", symbol: "XAF", decimals: 0 },
  RWF: { code: "RWF", name: "Rwandan Franc", symbol: "RWF", decimals: 0 },
  TZS: { code: "TZS", name: "Tanzanian Shilling", symbol: "TZS", decimals: 2 },
  UGX: { code: "UGX", name: "Ugandan Shilling", symbol: "UGX", decimals: 0 },
};

export function normalizeCurrencyCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  if (upper.length !== 3) return null;
  return upper;
}

export function isKnownCurrency(code: string): boolean {
  return code.toUpperCase() in CURRENCIES;
}