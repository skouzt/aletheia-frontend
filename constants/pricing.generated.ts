/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Produced by backend/server/scripts/gen_pricing_ts.py from core/billing/catalog.py,
 * the same table that scripts/sync_dodo_prices.py pushes to Dodo. Editing this file
 * by hand reintroduces the drift it exists to prevent.
 *
 * Regenerate:  python scripts/gen_pricing_ts.py
 * Catalogue rev: 31ff38b   Countries: 109
 *
 * This is the OFFLINE FALLBACK only. The server decides the real price — it can see
 * the edge geo header, whereas the device only knows its own locale setting, which
 * a user can change in Settings.
 */

export interface CountryPricing {
  currency: string;
  monthly: number;
  yearly: number;
  monthlyLabel: string;
  yearlyLabel: string;
}

/** Charged to any country without a rule of its own — matches Dodo's base price. */
export const BASE_PRICING: CountryPricing = {
  currency: 'USD',
  monthly: 7.99,
  yearly: 79.99,
  monthlyLabel: '$7.99',
  yearlyLabel: '$79.99',
};

export const PRICING_BY_COUNTRY: Record<string, CountryPricing> = {
  AE: { currency: 'AED', monthly: 29, yearly: 299, monthlyLabel: 'AED 29', yearlyLabel: 'AED 299' },
  AM: { currency: 'AMD', monthly: 2990, yearly: 29900, monthlyLabel: '֏2,990', yearlyLabel: '֏29,900' },
  AR: { currency: 'USD', monthly: 4.99, yearly: 49.99, monthlyLabel: '$4.99', yearlyLabel: '$49.99' },
  AT: { currency: 'EUR', monthly: 7.99, yearly: 79.99, monthlyLabel: '€7.99', yearlyLabel: '€79.99' },
  AU: { currency: 'AUD', monthly: 11.99, yearly: 119.99, monthlyLabel: 'A$11.99', yearlyLabel: 'A$119.99' },
  BA: { currency: 'BAM', monthly: 7.99, yearly: 79.99, monthlyLabel: 'KM 7.99', yearlyLabel: 'KM 79.99' },
  BD: { currency: 'BDT', monthly: 199, yearly: 1999, monthlyLabel: '৳199', yearlyLabel: '৳1,999' },
  BE: { currency: 'EUR', monthly: 7.99, yearly: 79.99, monthlyLabel: '€7.99', yearlyLabel: '€79.99' },
  BG: { currency: 'EUR', monthly: 5.99, yearly: 59.99, monthlyLabel: '€5.99', yearlyLabel: '€59.99' },
  BH: { currency: 'BHD', monthly: 2.99, yearly: 29.90, monthlyLabel: 'BHD 2.99', yearlyLabel: 'BHD 29.90' },
  BM: { currency: 'USD', monthly: 7.99, yearly: 79.99, monthlyLabel: '$7.99', yearlyLabel: '$79.99' },
  BN: { currency: 'BND', monthly: 9.99, yearly: 99, monthlyLabel: 'B$9.99', yearlyLabel: 'B$99' },
  BO: { currency: 'BOB', monthly: 39, yearly: 399, monthlyLabel: 'Bs 39', yearlyLabel: 'Bs 399' },
  BR: { currency: 'BRL', monthly: 29.90, yearly: 299, monthlyLabel: 'R$29.90', yearlyLabel: 'R$299' },
  BS: { currency: 'BSD', monthly: 7.99, yearly: 79.99, monthlyLabel: 'B$7.99', yearlyLabel: 'B$79.99' },
  BW: { currency: 'BWP', monthly: 69, yearly: 690, monthlyLabel: 'BWP 69', yearlyLabel: 'BWP 690' },
  BZ: { currency: 'BZD', monthly: 15, yearly: 149, monthlyLabel: 'BZ$15', yearlyLabel: 'BZ$149' },
  CA: { currency: 'CAD', monthly: 10.99, yearly: 109.99, monthlyLabel: 'C$10.99', yearlyLabel: 'C$109.99' },
  CH: { currency: 'CHF', monthly: 7.99, yearly: 79.99, monthlyLabel: 'CHF 7.99', yearlyLabel: 'CHF 79.99' },
  CL: { currency: 'CLP', monthly: 5990, yearly: 59900, monthlyLabel: 'CLP 5,990', yearlyLabel: 'CLP 59,900' },
  CN: { currency: 'CNY', monthly: 49, yearly: 499, monthlyLabel: '¥49', yearlyLabel: '¥499' },
  CO: { currency: 'USD', monthly: 4.99, yearly: 49.99, monthlyLabel: '$4.99', yearlyLabel: '$49.99' },
  CR: { currency: 'CRC', monthly: 3990, yearly: 39900, monthlyLabel: '₡3,990', yearlyLabel: '₡39,900' },
  CY: { currency: 'EUR', monthly: 7.99, yearly: 79.99, monthlyLabel: '€7.99', yearlyLabel: '€79.99' },
  CZ: { currency: 'CZK', monthly: 179, yearly: 1790, monthlyLabel: '179 Kč', yearlyLabel: '1,790 Kč' },
  DE: { currency: 'EUR', monthly: 7.99, yearly: 79.99, monthlyLabel: '€7.99', yearlyLabel: '€79.99' },
  DK: { currency: 'DKK', monthly: 59, yearly: 599, monthlyLabel: '59 kr', yearlyLabel: '599 kr' },
  DO: { currency: 'DOP', monthly: 399, yearly: 3999, monthlyLabel: 'RD$399', yearlyLabel: 'RD$3,999' },
  EC: { currency: 'USD', monthly: 4.99, yearly: 49.99, monthlyLabel: '$4.99', yearlyLabel: '$49.99' },
  EE: { currency: 'EUR', monthly: 6.99, yearly: 69.99, monthlyLabel: '€6.99', yearlyLabel: '€69.99' },
  EG: { currency: 'EGP', monthly: 249, yearly: 2490, monthlyLabel: 'EGP 249', yearlyLabel: 'EGP 2,490' },
  ES: { currency: 'EUR', monthly: 7.99, yearly: 79.99, monthlyLabel: '€7.99', yearlyLabel: '€79.99' },
  ET: { currency: 'ETB', monthly: 499, yearly: 4990, monthlyLabel: 'ETB 499', yearlyLabel: 'ETB 4,990' },
  FI: { currency: 'EUR', monthly: 7.99, yearly: 79.99, monthlyLabel: '€7.99', yearlyLabel: '€79.99' },
  FJ: { currency: 'FJD', monthly: 12.99, yearly: 129, monthlyLabel: 'FJ$12.99', yearlyLabel: 'FJ$129' },
  FR: { currency: 'EUR', monthly: 7.99, yearly: 79.99, monthlyLabel: '€7.99', yearlyLabel: '€79.99' },
  GB: { currency: 'GBP', monthly: 6.99, yearly: 69.99, monthlyLabel: '£6.99', yearlyLabel: '£69.99' },
  GE: { currency: 'GEL', monthly: 19.90, yearly: 199, monthlyLabel: '₾19.90', yearlyLabel: '₾199' },
  GH: { currency: 'USD', monthly: 4.99, yearly: 49.99, monthlyLabel: '$4.99', yearlyLabel: '$49.99' },
  GR: { currency: 'EUR', monthly: 6.99, yearly: 69.99, monthlyLabel: '€6.99', yearlyLabel: '€69.99' },
  GT: { currency: 'GTQ', monthly: 59, yearly: 599, monthlyLabel: 'Q59', yearlyLabel: 'Q599' },
  HK: { currency: 'HKD', monthly: 59, yearly: 599, monthlyLabel: 'HK$59', yearlyLabel: 'HK$599' },
  HN: { currency: 'HNL', monthly: 199, yearly: 1999, monthlyLabel: 'L199', yearlyLabel: 'L1,999' },
  HR: { currency: 'EUR', monthly: 6.99, yearly: 69.99, monthlyLabel: '€6.99', yearlyLabel: '€69.99' },
  HU: { currency: 'HUF', monthly: 2490, yearly: 24900, monthlyLabel: '2,490 Ft', yearlyLabel: '24,900 Ft' },
  ID: { currency: 'IDR', monthly: 49000, yearly: 490000, monthlyLabel: 'Rp49,000', yearlyLabel: 'Rp490,000' },
  IE: { currency: 'EUR', monthly: 7.99, yearly: 79.99, monthlyLabel: '€7.99', yearlyLabel: '€79.99' },
  IL: { currency: 'ILS', monthly: 29, yearly: 299, monthlyLabel: '₪29', yearlyLabel: '₪299' },
  IN: { currency: 'INR', monthly: 149, yearly: 999, monthlyLabel: '₹149', yearlyLabel: '₹999' },
  IQ: { currency: 'IQD', monthly: 7500, yearly: 75000, monthlyLabel: 'IQD 7,500', yearlyLabel: 'IQD 75,000' },
  IS: { currency: 'EUR', monthly: 7.99, yearly: 79.99, monthlyLabel: '€7.99', yearlyLabel: '€79.99' },
  IT: { currency: 'EUR', monthly: 7.99, yearly: 79.99, monthlyLabel: '€7.99', yearlyLabel: '€79.99' },
  JO: { currency: 'JOD', monthly: 5.49, yearly: 54.90, monthlyLabel: 'JOD 5.49', yearlyLabel: 'JOD 54.90' },
  JP: { currency: 'JPY', monthly: 1000, yearly: 9900, monthlyLabel: '¥1,000', yearlyLabel: '¥9,900' },
  KE: { currency: 'USD', monthly: 3.99, yearly: 39.99, monthlyLabel: '$3.99', yearlyLabel: '$39.99' },
  KR: { currency: 'KRW', monthly: 9900, yearly: 99000, monthlyLabel: '₩9,900', yearlyLabel: '₩99,000' },
  KW: { currency: 'KWD', monthly: 2.49, yearly: 24.90, monthlyLabel: 'KWD 2.49', yearlyLabel: 'KWD 24.90' },
  KZ: { currency: 'KZT', monthly: 3990, yearly: 39900, monthlyLabel: '₸3,990', yearlyLabel: '₸39,900' },
  LB: { currency: 'USD', monthly: 3.99, yearly: 39.99, monthlyLabel: '$3.99', yearlyLabel: '$39.99' },
  LK: { currency: 'LKR', monthly: 999, yearly: 9999, monthlyLabel: 'LKR 999', yearlyLabel: 'LKR 9,999' },
  LT: { currency: 'EUR', monthly: 6.99, yearly: 69.99, monthlyLabel: '€6.99', yearlyLabel: '€69.99' },
  LU: { currency: 'EUR', monthly: 7.99, yearly: 79.99, monthlyLabel: '€7.99', yearlyLabel: '€79.99' },
  LV: { currency: 'EUR', monthly: 6.99, yearly: 69.99, monthlyLabel: '€6.99', yearlyLabel: '€69.99' },
  MA: { currency: 'MAD', monthly: 49, yearly: 490, monthlyLabel: 'MAD 49', yearlyLabel: 'MAD 490' },
  MG: { currency: 'USD', monthly: 2.99, yearly: 29.99, monthlyLabel: '$2.99', yearlyLabel: '$29.99' },
  MK: { currency: 'MKD', monthly: 399, yearly: 3990, monthlyLabel: 'MKD 399', yearlyLabel: 'MKD 3,990' },
  MT: { currency: 'EUR', monthly: 7.99, yearly: 79.99, monthlyLabel: '€7.99', yearlyLabel: '€79.99' },
  MU: { currency: 'MUR', monthly: 199, yearly: 1990, monthlyLabel: 'MUR 199', yearlyLabel: 'MUR 1,990' },
  MV: { currency: 'MVR', monthly: 99, yearly: 999, monthlyLabel: 'MVR 99', yearlyLabel: 'MVR 999' },
  MX: { currency: 'MXN', monthly: 99, yearly: 999, monthlyLabel: 'MX$99', yearlyLabel: 'MX$999' },
  MY: { currency: 'MYR', monthly: 19.90, yearly: 199, monthlyLabel: 'RM19.90', yearlyLabel: 'RM199' },
  NA: { currency: 'USD', monthly: 4.99, yearly: 49.99, monthlyLabel: '$4.99', yearlyLabel: '$49.99' },
  NG: { currency: 'NGN', monthly: 4999, yearly: 49990, monthlyLabel: '₦4,999', yearlyLabel: '₦49,990' },
  NL: { currency: 'EUR', monthly: 7.99, yearly: 79.99, monthlyLabel: '€7.99', yearlyLabel: '€79.99' },
  NO: { currency: 'NOK', monthly: 79, yearly: 799, monthlyLabel: '79 kr', yearlyLabel: '799 kr' },
  NP: { currency: 'NPR', monthly: 399, yearly: 3999, monthlyLabel: 'NPR 399', yearlyLabel: 'NPR 3,999' },
  NZ: { currency: 'NZD', monthly: 12.99, yearly: 129.99, monthlyLabel: 'NZ$12.99', yearlyLabel: 'NZ$129.99' },
  OM: { currency: 'OMR', monthly: 2.49, yearly: 24.90, monthlyLabel: 'OMR 2.49', yearlyLabel: 'OMR 24.90' },
  PE: { currency: 'PEN', monthly: 19.90, yearly: 199, monthlyLabel: 'S/19.90', yearlyLabel: 'S/199' },
  PG: { currency: 'PGK', monthly: 39, yearly: 390, monthlyLabel: 'PGK 39', yearlyLabel: 'PGK 390' },
  PH: { currency: 'PHP', monthly: 249, yearly: 2490, monthlyLabel: '₱249', yearlyLabel: '₱2,490' },
  PK: { currency: 'USD', monthly: 1.99, yearly: 19.99, monthlyLabel: '$1.99', yearlyLabel: '$19.99' },
  PL: { currency: 'PLN', monthly: 29.99, yearly: 299, monthlyLabel: '29.99 zł', yearlyLabel: '299 zł' },
  PT: { currency: 'EUR', monthly: 6.99, yearly: 69.99, monthlyLabel: '€6.99', yearlyLabel: '€69.99' },
  PY: { currency: 'PYG', monthly: 29900, yearly: 299000, monthlyLabel: '₲29,900', yearlyLabel: '₲299,000' },
  QA: { currency: 'QAR', monthly: 29, yearly: 299, monthlyLabel: 'QAR 29', yearlyLabel: 'QAR 299' },
  RO: { currency: 'RON', monthly: 34.99, yearly: 349.99, monthlyLabel: '34.99 lei', yearlyLabel: '349.99 lei' },
  RS: { currency: 'RSD', monthly: 699, yearly: 6990, monthlyLabel: 'RSD 699', yearlyLabel: 'RSD 6,990' },
  SA: { currency: 'SAR', monthly: 29, yearly: 299, monthlyLabel: 'SAR 29', yearlyLabel: 'SAR 299' },
  SB: { currency: 'SBD', monthly: 39, yearly: 390, monthlyLabel: 'SBD 39', yearlyLabel: 'SBD 390' },
  SC: { currency: 'SCR', monthly: 79, yearly: 790, monthlyLabel: 'SCR 79', yearlyLabel: 'SCR 790' },
  SE: { currency: 'SEK', monthly: 79, yearly: 799, monthlyLabel: '79 kr', yearlyLabel: '799 kr' },
  SG: { currency: 'SGD', monthly: 9.99, yearly: 99.99, monthlyLabel: 'S$9.99', yearlyLabel: 'S$99.99' },
  SI: { currency: 'EUR', monthly: 6.99, yearly: 69.99, monthlyLabel: '€6.99', yearlyLabel: '€69.99' },
  SK: { currency: 'EUR', monthly: 6.99, yearly: 69.99, monthlyLabel: '€6.99', yearlyLabel: '€69.99' },
  TH: { currency: 'THB', monthly: 199, yearly: 1990, monthlyLabel: '฿199', yearlyLabel: '฿1,990' },
  TO: { currency: 'TOP', monthly: 19, yearly: 190, monthlyLabel: 'TOP 19', yearlyLabel: 'TOP 190' },
  TR: { currency: 'TRY', monthly: 149, yearly: 1490, monthlyLabel: '₺149', yearlyLabel: '₺1,490' },
  TW: { currency: 'TWD', monthly: 249, yearly: 2490, monthlyLabel: 'NT$249', yearlyLabel: 'NT$2,490' },
  TZ: { currency: 'TZS', monthly: 9900, yearly: 99000, monthlyLabel: 'TZS 9,900', yearlyLabel: 'TZS 99,000' },
  UG: { currency: 'USD', monthly: 3.99, yearly: 39.99, monthlyLabel: '$3.99', yearlyLabel: '$39.99' },
  US: { currency: 'USD', monthly: 7.99, yearly: 79.99, monthlyLabel: '$7.99', yearlyLabel: '$79.99' },
  UY: { currency: 'UYU', monthly: 299, yearly: 2990, monthlyLabel: 'UYU 299', yearlyLabel: 'UYU 2,990' },
  VE: { currency: 'USD', monthly: 3.99, yearly: 39.99, monthlyLabel: '$3.99', yearlyLabel: '$39.99' },
  VN: { currency: 'VND', monthly: 79000, yearly: 790000, monthlyLabel: '₫79,000', yearlyLabel: '₫790,000' },
  VU: { currency: 'VUV', monthly: 799, yearly: 7990, monthlyLabel: 'VUV 799', yearlyLabel: 'VUV 7,990' },
  WS: { currency: 'WST', monthly: 19, yearly: 190, monthlyLabel: 'WST 19', yearlyLabel: 'WST 190' },
  ZA: { currency: 'ZAR', monthly: 99, yearly: 999, monthlyLabel: 'R99', yearlyLabel: 'R999' },
  ZM: { currency: 'ZMW', monthly: 49, yearly: 490, monthlyLabel: 'ZMW 49', yearlyLabel: 'ZMW 490' },
};

export function pricingForCountry(code?: string | null): CountryPricing {
  if (!code) return BASE_PRICING;
  return PRICING_BY_COUNTRY[code.toUpperCase()] ?? BASE_PRICING;
}
