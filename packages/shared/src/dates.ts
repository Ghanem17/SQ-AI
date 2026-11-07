// Dates and times as the app shows them: Western digits, 24-hour clock, and
// the month names used in Iraq (أيار، حزيران… تشرين الثاني).

const monthsAr = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
const monthsArShort = ['ك. الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'ت. الأول', 'ت. الثاني', 'ك. الأول'];
const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const daysAr = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number) => String(n).padStart(2, '0');

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "7 تشرين الثاني 2026" or "7 November 2026".
export function formatDate(ts: number, lang: 'ar' | 'en'): string {
  const d = new Date(ts);
  return `${d.getDate()} ${(lang === 'ar' ? monthsAr : monthsEn)[d.getMonth()]} ${d.getFullYear()}`;
}

export function monthShort(month: number, lang: 'ar' | 'en'): string {
  return lang === 'ar' ? monthsArShort[month] : monthsEn[month].slice(0, 3);
}

export function dayShort(weekday: number, lang: 'ar' | 'en'): string {
  return (lang === 'ar' ? daysAr : daysEn)[weekday];
}

// Short names of the `count` days ending on `endTs`, oldest first.
export function lastDays(endTs: number, count: number, lang: 'ar' | 'en'): string[] {
  const end = new Date(endTs);
  return Array.from({ length: count }, (_, i) => dayShort((end.getDay() - (count - 1 - i) + 7 * count) % 7, lang));
}

// Short names of the `count` months ending with the month of `endTs`, oldest first.
export function lastMonths(endTs: number, count: number, lang: 'ar' | 'en'): string[] {
  const end = new Date(endTs).getMonth();
  return Array.from({ length: count }, (_, i) => monthShort((end - (count - 1 - i) + 12 * count) % 12, lang));
}
