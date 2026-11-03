import type { PublishWhen } from '@/state/studio';
import { bestTimeHint } from '@/features/reel/shots';

const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function dayLabel(offset: number, from = new Date()): string {
  if (offset === 0) return 'اليوم';
  if (offset === 1) return 'غدًا';
  const d = new Date(from);
  d.setDate(d.getDate() + offset);
  return dayNames[d.getDay()];
}

export function dayDate(offset: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + offset);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function timeLabel(hour: number, minute = 0): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const part = hour < 12 ? 'صباحًا' : hour < 17 ? 'ظهرًا' : 'مساءً';
  return `${h}:${String(minute).padStart(2, '0')} ${part}`;
}

export function describeWhen(when: PublishWhen): string {
  if (when.kind === 'best') return `أفضل وقت · ${bestTimeHint.label}`;
  if (when.kind === 'now') return 'فور الموافقة';
  return `${dayLabel(when.day)}، ${timeLabel(when.hour, when.minute)}`;
}
