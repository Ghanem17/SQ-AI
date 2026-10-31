// Numbers use Western digits with comma grouping, as in the approved designs.

export function formatNumber(value: number): string {
  const fixed = Math.round(value).toString();
  const negative = fixed.startsWith('-');
  const digits = negative ? fixed.slice(1) : fixed;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return negative ? `-${grouped}` : grouped;
}

export function formatIQD(value: number): string {
  return `${formatNumber(value)} د.ع`;
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}
