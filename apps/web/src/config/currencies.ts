export type CurrencyOption = {
  code: string;
  name: string;
  symbol: string;
};

export const currencies: CurrencyOption[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "EUR" },
  { code: "GBP", name: "Pound Sterling", symbol: "GBP" },
  { code: "NGN", name: "Nigerian Naira", symbol: "NGN" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GHS" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KES" },
  { code: "ZAR", name: "South African Rand", symbol: "ZAR" },
  { code: "EGP", name: "Egyptian Pound", symbol: "EGP" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "MAD" },
  { code: "TND", name: "Tunisian Dinar", symbol: "TND" },
  { code: "DZD", name: "Algerian Dinar", symbol: "DZD" },
  { code: "ETB", name: "Ethiopian Birr", symbol: "ETB" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "UGX" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TZS" },
  { code: "RWF", name: "Rwandan Franc", symbol: "RWF" },
  { code: "XOF", name: "West African CFA Franc", symbol: "XOF" },
  { code: "XAF", name: "Central African CFA Franc", symbol: "XAF" },
  { code: "AOA", name: "Angolan Kwanza", symbol: "AOA" },
  { code: "MZN", name: "Mozambican Metical", symbol: "MZN" },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "ZMW" },
  { code: "BWP", name: "Botswana Pula", symbol: "BWP" },
  { code: "NAD", name: "Namibian Dollar", symbol: "NAD" },
  { code: "MUR", name: "Mauritian Rupee", symbol: "MUR" },
  { code: "MAD-ALT", name: "Moroccan Dirham", symbol: "MAD" },
];

export function currencySymbol(code: string): string {
  return currencies.find((c) => c.code === code)?.symbol ?? code;
}