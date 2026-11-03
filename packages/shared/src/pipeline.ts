// The automation map: which AI or platform API handles each step, per
// destination. The server follows the same table, so what the customer sees
// here is what actually runs.

import type { Platform } from './types.ts';
import type { Text, ToolId } from './pricing.ts';

export type StepId = 'idea' | 'shotList' | 'qualityCheck' | 'edit' | 'caption' | 'publish' | 'promote' | 'reply' | 'report';

export type Step = {
  id: StepId;
  name: Text;
  detail: Text;
  // The tool used for every platform, unless a platform overrides it.
  tools: ToolId[];
  perPlatform?: Partial<Record<Platform, ToolId[]>>;
};

export const pipeline: Step[] = [
  { id: 'idea', name: { ar: 'اقتراح الفكرة', en: 'Idea' }, detail: { ar: 'من خطة الشهر وأداء الريلز السابقة', en: 'From the monthly plan and how past reels did' }, tools: ['claude'] },
  { id: 'shotList', name: { ar: 'قائمة اللقطات', en: 'Shot list' }, detail: { ar: 'زوايا وإضاءة ومدة كل لقطة', en: 'Angle, light and length of each shot' }, tools: ['claude'] },
  { id: 'qualityCheck', name: { ar: 'فحص اللقطة', en: 'Shot check' }, detail: { ar: 'الإضاءة والاهتزاز والإطار، على الهاتف', en: 'Light, shake and framing, on the phone' }, tools: [] },
  { id: 'edit', name: { ar: 'المونتاج', en: 'Editing' }, detail: { ar: 'حسب مستوى الجودة المختار', en: 'At the chosen quality level' }, tools: ['ffmpeg', 'lyria', 'elevenlabs'] },
  {
    id: 'caption',
    name: { ar: 'الوصف والوسوم', en: 'Caption and hashtags' },
    detail: { ar: 'نص مختلف يناسب كل منصة', en: 'Different copy for each platform' },
    tools: ['claude'],
  },
  {
    id: 'publish',
    name: { ar: 'النشر', en: 'Publishing' },
    detail: { ar: 'في أفضل وقت لجمهورك أو في الوقت الذي تحدده', en: 'At the best time for your audience, or when you choose' },
    tools: ['metaApi'],
    perPlatform: { tiktok: ['tiktokApi'], youtube: ['youtubeApi'] },
  },
  {
    id: 'promote',
    name: { ar: 'الترويج', en: 'Promotion' },
    detail: { ar: 'ضمن سقف الصرف الشهري', en: 'Within the monthly spending cap' },
    tools: ['metaAds'],
    perPlatform: { tiktok: ['tiktokAds'] },
  },
  {
    id: 'reply',
    name: { ar: 'الرد على العملاء', en: 'Customer replies' },
    detail: { ar: 'يسجّل الطلبات ويحيل إليك الحالات الحساسة', en: 'Logs orders and hands sensitive cases to you' },
    tools: ['claude', 'metaApi'],
    perPlatform: { whatsapp: ['claude', 'whatsappApi'] },
  },
  { id: 'report', name: { ar: 'التقرير', en: 'Report' }, detail: { ar: 'تكلفة كل طلب ومصدره', en: 'The cost of each order and where it came from' }, tools: ['claude'] },
];

export function toolsFor(step: Step, platform: Platform): ToolId[] {
  return step.perPlatform?.[platform] ?? step.tools;
}

export const platformNames: Record<Platform, Text> = {
  instagram: { ar: 'إنستغرام', en: 'Instagram' },
  facebook: { ar: 'فيسبوك', en: 'Facebook' },
  tiktok: { ar: 'تيك توك', en: 'TikTok' },
  whatsapp: { ar: 'واتساب', en: 'WhatsApp' },
  messenger: { ar: 'ماسنجر', en: 'Messenger' },
  youtube: { ar: 'يوتيوب', en: 'YouTube' },
};

// Short marks for compact lists. Brand logos are not drawn.
export const platformMarks: Record<Platform, string> = {
  instagram: 'IG',
  facebook: 'FB',
  tiktok: 'TT',
  whatsapp: 'WA',
  messenger: 'MS',
  youtube: 'YT',
};
