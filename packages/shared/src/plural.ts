// Counted nouns in both languages. Arabic agrees with the number:
// 1 أداة واحدة، 2 أداتان، 3–10 أدوات، 11 وما فوق أداةً بالمفرد.

export type ArabicForms = { one: string; two: string; few: string; many: string };

export const nouns = {
  tool: { ar: { one: 'أداة واحدة', two: 'أداتان', few: 'أدوات', many: 'أداة' }, en: ['tool', 'tools'] },
  shot: { ar: { one: 'لقطة واحدة', two: 'لقطتان', few: 'لقطات', many: 'لقطة' }, en: ['shot', 'shots'] },
  day: { ar: { one: 'يوم واحد', two: 'يومان', few: 'أيام', many: 'يومًا' }, en: ['day', 'days'] },
  reel: { ar: { one: 'ريل واحد', two: 'ريلان', few: 'ريلز', many: 'ريلًا' }, en: ['reel', 'reels'] },
  order: { ar: { one: 'طلب واحد', two: 'طلبان', few: 'طلبات', many: 'طلبًا' }, en: ['order', 'orders'] },
  step: { ar: { one: 'مرحلة واحدة', two: 'مرحلتان', few: 'مراحل', many: 'مرحلة' }, en: ['step', 'steps'] },
  hour: { ar: { one: 'ساعة واحدة', two: 'ساعتان', few: 'ساعات', many: 'ساعة' }, en: ['hour', 'hours'] },
  second: { ar: { one: 'ثانية واحدة', two: 'ثانيتان', few: 'ثوانٍ', many: 'ثانية' }, en: ['second', 'seconds'] },
  video: { ar: { one: 'فيديو واحد', two: 'فيديوهان', few: 'فيديوهات', many: 'فيديو' }, en: ['video', 'videos'] },
} as const satisfies Record<string, { ar: ArabicForms; en: readonly [string, string] }>;

export type Noun = keyof typeof nouns;

export function countAr(n: number, f: ArabicForms): string {
  if (n === 1) return f.one;
  if (n === 2) return f.two;
  const r = Math.abs(n) % 100;
  // 3–10 take the plural; 11 and above (and 100, 200…) take the singular.
  if (n !== 0 && r >= 3 && r <= 10) return `${n} ${f.few}`;
  if (n === 0) return `${n} ${f.few}`;
  return `${n} ${f.many}`;
}

export function countEn(n: number, one: string, other: string): string {
  return `${n} ${n === 1 ? one : other}`;
}

// "3 أدوات" / "3 tools", agreeing with the number in each language.
export function count(n: number, noun: Noun, lang: 'ar' | 'en'): string {
  const forms = nouns[noun];
  return lang === 'ar' ? countAr(n, forms.ar) : countEn(n, forms.en[0], forms.en[1]);
}
