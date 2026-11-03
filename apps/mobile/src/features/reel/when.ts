import type { PublishWhen } from '@/state/studio';
import { bestTimeHint } from '@/features/reel/shots';

type Lang = 'ar' | 'en';

const dayNames = {
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

export function dayLabel(offset: number, lang: Lang, from = new Date()): string {
  if (offset === 0) return lang === 'ar' ? 'اليوم' : 'Today';
  if (offset === 1) return lang === 'ar' ? 'غدًا' : 'Tomorrow';
  const d = new Date(from);
  d.setDate(d.getDate() + offset);
  return dayNames[lang][d.getDay()];
}

export function dayDate(offset: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + offset);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function timeLabel(hour: number, minute: number, lang: Lang): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const mm = String(minute).padStart(2, '0');
  if (lang === 'en') return `${h}:${mm} ${hour < 12 ? 'am' : 'pm'}`;
  const part = hour < 12 ? 'صباحًا' : hour < 17 ? 'ظهرًا' : 'مساءً';
  return `${h}:${mm} ${part}`;
}

export function describeWhen(when: PublishWhen, lang: Lang): string {
  if (when.kind === 'best') return lang === 'ar' ? `أفضل وقت · ${bestTimeHint.label.ar}` : `Best time · ${bestTimeHint.label.en}`;
  if (when.kind === 'now') return lang === 'ar' ? 'فور الموافقة' : 'As soon as approved';
  return `${dayLabel(when.day, lang)}${lang === 'ar' ? '، ' : ', '}${timeLabel(when.hour, when.minute, lang)}`;
}
