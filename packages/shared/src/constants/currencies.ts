export interface CurrencyEntry {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export const CURRENCIES: CurrencyEntry[] = [
  { code: "USD", name: "US Dollar", symbol: "$", decimals: 2 },
  { code: "EUR", name: "Euro", symbol: "EUR", decimals: 2 },
  { code: "GBP", name: "Pound Sterling", symbol: "GBP", decimals: 2 },
  { code: "NGN", name: "Nigerian Naira", symbol: "NGN", decimals: 2 },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GHS", decimals: 2 },
  { code: "KES", name: "Kenyan Shilling", symbol: "KES", decimals: 2 },
  { code: "ZAR", name: "South African Rand", symbol: "ZAR", decimals: 2 },
  { code: "EGP", name: "Egyptian Pound", symbol: "EGP", decimals: 2 },
  { code: "MAD", name: "Moroccan Dirham", symbol: "MAD", decimals: 2 },
  { code: "XOF", name: "West African CFA Franc", symbol: "XOF", decimals: 0 },
  { code: "XAF", name: "Central African CFA Franc", symbol: "XAF", decimals: 0 },
  { code: "RWF", name: "Rwandan Franc", symbol: "RWF", decimals: 0 },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TZS", decimals: 2 },
  { code: "UGX", name: "Ugandan Shilling", symbol: "UGX", decimals: 0 },
];