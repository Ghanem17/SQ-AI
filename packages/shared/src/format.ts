// Numbers use Western digits with comma grouping, as in the approved designs.

export function formatNumber(value: number): string {
  const fixed = Math.round(value).toString();
  const negative = fixed.startsWith('-');
  const digits = negative ? fixed.slice(1) : fixed;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return negative ? `-${grouped}` : grouped;
}

// The app language decides the currency label; the app sets it once per
// render of the session, before any screen draws a price.
let currencyLang: 'ar' | 'en' = 'ar';
export function setCurrencyLang(lang: 'ar' | 'en'): void {
  currencyLang = lang;
}

export function formatIQD(value: number): string {
  return currencyLang === 'en' ? `IQD ${formatNumber(value)}` : `${formatNumber(value)} د.ع`;
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}
