import { count, type Noun } from '@sq/shared';
import { useSession } from '@/state/session';

import { ar } from './ar';
import { en } from './en';

export type Lang = 'ar' | 'en';

export type I18n = {
  lang: Lang;
  rtl: boolean;
  // Shared dictionary for onboarding, sign-in and tabs.
  t: typeof en;
  // Picks the string for the current language: L('عربي', 'English').
  L: (arText: string, enText: string) => string;
  // Picks from a { ar, en } pair.
  pick: (text: { ar: string; en: string }) => string;
  // A counted noun that agrees with the number: n(2, 'tool') → "أداتان" / "2 tools".
  n: (value: number, noun: Noun) => string;
};

export function i18nFor(lang: Lang): I18n {
  return {
    lang,
    rtl: lang === 'ar',
    t: lang === 'ar' ? ar : en,
    L: (a, e) => (lang === 'ar' ? a : e),
    pick: (text) => text[lang],
    n: (value, noun) => count(value, noun, lang),
  };
}

const cache = { ar: i18nFor('ar'), en: i18nFor('en') };

export function useI18n(): I18n {
  return cache[useSession().lang];
}
