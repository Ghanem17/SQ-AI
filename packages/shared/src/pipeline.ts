// The automation map: which AI or platform API handles each step, per
// destination. The server follows the same table, so what the customer sees
// here is what actually runs.

import type { Platform } from './types.ts';
import type { ToolId } from './pricing.ts';

export type StepId = 'idea' | 'shotList' | 'qualityCheck' | 'edit' | 'caption' | 'publish' | 'promote' | 'reply' | 'report';

export type Step = {
  id: StepId;
  name: string;
  detail: string;
  // The tool used for every platform, unless a platform overrides it.
  tools: ToolId[];
  perPlatform?: Partial<Record<Platform, ToolId[]>>;
};

export const pipeline: Step[] = [
  { id: 'idea', name: 'اقتراح الفكرة', detail: 'من خطة الشهر وأداء الريلز السابقة', tools: ['claude'] },
  { id: 'shotList', name: 'قائمة اللقطات', detail: 'زوايا وإضاءة ومدة كل لقطة', tools: ['claude'] },
  { id: 'qualityCheck', name: 'فحص اللقطة', detail: 'الإضاءة والاهتزاز والإطار، على الموبايل', tools: [] },
  { id: 'edit', name: 'المونتاج', detail: 'حسب مستوى الجودة المختار', tools: ['shotstack', 'whisper', 'suno'] },
  {
    id: 'caption',
    name: 'الكابشن والهاشتاغات',
    detail: 'نص مختلف يناسب كل منصة',
    tools: ['claude'],
  },
  {
    id: 'publish',
    name: 'النشر',
    detail: 'في أفضل وقت لجمهورك أو في الوقت الذي تحدده',
    tools: ['metaApi'],
    perPlatform: { tiktok: ['tiktokApi'], youtube: ['youtubeApi'] },
  },
  {
    id: 'promote',
    name: 'الترويج',
    detail: 'ضمن سقف الصرف الشهري',
    tools: ['metaAds'],
    perPlatform: { tiktok: ['tiktokAds'] },
  },
  {
    id: 'reply',
    name: 'الرد على الزبائن',
    detail: 'يسجّل الطلبات ويحوّل الحالات الحساسة لك',
    tools: ['claude', 'metaApi'],
    perPlatform: { whatsapp: ['claude', 'whatsappApi'] },
  },
  { id: 'report', name: 'التقرير', detail: 'كلفة كل طلب ومن أين جاء', tools: ['claude'] },
];

export function toolsFor(step: Step, platform: Platform): ToolId[] {
  return step.perPlatform?.[platform] ?? step.tools;
}

export const platformNames: Record<Platform, string> = {
  instagram: 'إنستغرام',
  facebook: 'فيسبوك',
  tiktok: 'تيك توك',
  whatsapp: 'واتساب',
  messenger: 'ماسنجر',
  youtube: 'يوتيوب',
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
