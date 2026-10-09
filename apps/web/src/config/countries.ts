export type CountryOption = {
  code: string;
  name: string;
  region: string;
};

const worldRegionNames = new Intl.DisplayNames(["en"], { type: "region" });
const worldCountryCodes = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ
EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY
HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ
LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ
NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW
SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ
UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW
`
  .trim()
  .split(/\s+/);

export const allCountries: CountryOption[] = worldCountryCodes
  .map((code) => ({
    code,
    name: worldRegionNames.of(code) ?? code,
    region: "Global",
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const africanCountries: CountryOption[] = [
  { code: "DZ", name: "Algeria", region: "North Africa" },
  { code: "AO", name: "Angola", region: "Southern Africa" },
  { code: "BJ", name: "Benin", region: "West Africa" },
  { code: "BW", name: "Botswana", region: "Southern Africa" },
  { code: "BF", name: "Burkina Faso", region: "West Africa" },
  { code: "BI", name: "Burundi", region: "East Africa" },
  { code: "CV", name: "Cabo Verde", region: "West Africa" },
  { code: "CM", name: "Cameroon", region: "Central Africa" },
  { code: "CF", name: "Central African Republic", region: "Central Africa" },
  { code: "TD", name: "Chad", region: "Central Africa" },
  { code: "KM", name: "Comoros", region: "East Africa" },
  { code: "CG", name: "Congo", region: "Central Africa" },
  { code: "CD", name: "Congo, Democratic Republic", region: "Central Africa" },
  { code: "CI", name: "Cote d'Ivoire", region: "West Africa" },
  { code: "DJ", name: "Djibouti", region: "East Africa" },
  { code: "EG", name: "Egypt", region: "North Africa" },
  { code: "GQ", name: "Equatorial Guinea", region: "Central Africa" },
  { code: "ER", name: "Eritrea", region: "East Africa" },
  { code: "SZ", name: "Eswatini", region: "Southern Africa" },
  { code: "ET", name: "Ethiopia", region: "East Africa" },
  { code: "GA", name: "Gabon", region: "Central Africa" },
  { code: "GM", name: "Gambia", region: "West Africa" },
  { code: "GH", name: "Ghana", region: "West Africa" },
  { code: "GN", name: "Guinea", region: "West Africa" },
  { code: "GW", name: "Guinea-Bissau", region: "West Africa" },
  { code: "KE", name: "Kenya", region: "East Africa" },
  { code: "LS", name: "Lesotho", region: "Southern Africa" },
  { code: "LR", name: "Liberia", region: "West Africa" },
  { code: "LY", name: "Libya", region: "North Africa" },
  { code: "MG", name: "Madagascar", region: "East Africa" },
  { code: "MW", name: "Malawi", region: "Southern Africa" },
  { code: "ML", name: "Mali", region: "West Africa" },
  { code: "MR", name: "Mauritania", region: "West Africa" },
  { code: "MU", name: "Mauritius", region: "East Africa" },
  { code: "MA", name: "Morocco", region: "North Africa" },
  { code: "MZ", name: "Mozambique", region: "Southern Africa" },
  { code: "NA", name: "Namibia", region: "Southern Africa" },
  { code: "NE", name: "Niger", region: "West Africa" },
  { code: "NG", name: "Nigeria", region: "West Africa" },
  { code: "RW", name: "Rwanda", region: "East Africa" },
  { code: "ST", name: "Sao Tome and Principe", region: "Central Africa" },
  { code: "SN", name: "Senegal", region: "West Africa" },
  { code: "SC", name: "Seychelles", region: "East Africa" },
  { code: "SL", name: "Sierra Leone", region: "West Africa" },
  { code: "SO", name: "Somalia", region: "East Africa" },
  { code: "ZA", name: "South Africa", region: "Southern Africa" },
  { code: "SS", name: "South Sudan", region: "East Africa" },
  { code: "SD", name: "Sudan", region: "North Africa" },
  { code: "TZ", name: "Tanzania", region: "East Africa" },
  { code: "TG", name: "Togo", region: "West Africa" },
  { code: "TN", name: "Tunisia", region: "North Africa" },
  { code: "UG", name: "Uganda", region: "East Africa" },
  { code: "ZM", name: "Zambia", region: "Southern Africa" },
  { code: "ZW", name: "Zimbabwe", region: "Southern Africa" },
];

export const countryRegions = [
  "North Africa",
  "West Africa",
  "Central Africa",
  "East Africa",
  "Southern Africa",
] as const;

export function countryName(code: string): string {
  return (
    allCountries.find((country) => country.code === code.toUpperCase())?.name ??
    africanCountries.find((country) => country.code === code.toUpperCase())?.name ??
    code
  );
}