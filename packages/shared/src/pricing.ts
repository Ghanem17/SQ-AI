// Reel pricing. Every price is the sum of the AI work it pays for plus the
// service fee, so the app can always show the customer why a reel costs what
// it costs. Tool costs follow fal.ai's listed rates for one 15-second
// reel; amounts are Iraqi dinars and are sample values until pricing is
// approved.

export type Tier = 'basic' | 'pro' | 'premium';

export type Text = { ar: string; en: string };

export type ToolId =
  | 'claude'
  | 'lyria'
  | 'elevenlabs'
  | 'geminiImage'
  | 'veo'
  | 'upscale'
  | 'ffmpeg'
  | 'metaApi'
  | 'tiktokApi'
  | 'youtubeApi'
  | 'whatsappApi'
  | 'metaAds'
  | 'tiktokAds';

// How each tool is reached: one fal.ai key for every AI model (Claude goes
// through fal's OpenRouter router), our own server for editing, and each
// platform's official API for publishing.
export type ToolVia = 'fal' | 'server' | 'platform';

export type Tool = { id: ToolId; name: string; vendor: string | Text; via: ToolVia; model?: string };

export const tools: Record<ToolId, Tool> = {
  claude: { id: 'claude', name: 'Claude Sonnet 5.5', vendor: 'Anthropic', via: 'fal', model: 'anthropic/claude-sonnet-5.5' },
  lyria: { id: 'lyria', name: 'Lyria 2', vendor: 'Google', via: 'fal', model: 'fal-ai/lyria2' },
  elevenlabs: { id: 'elevenlabs', name: 'ElevenLabs v4', vendor: 'ElevenLabs', via: 'fal', model: 'fal-ai/elevenlabs/tts/eleven-v4' },
  geminiImage: { id: 'geminiImage', name: 'Nano Banana Pro', vendor: 'Google', via: 'fal', model: 'fal-ai/nano-banana-pro' },
  veo: { id: 'veo', name: 'Veo 3.1 Fast', vendor: 'Google', via: 'fal', model: 'fal-ai/veo3.1/fast' },
  upscale: { id: 'upscale', name: 'Topaz Video Upscale', vendor: 'Topaz Labs', via: 'fal', model: 'fal-ai/topaz/upscale/video' },
  ffmpeg: { id: 'ffmpeg', name: 'ffmpeg', vendor: { ar: 'خادم SQ', en: 'SQ server' }, via: 'server' },
  metaApi: { id: 'metaApi', name: 'Meta Graph API', vendor: 'Meta', via: 'platform' },
  tiktokApi: { id: 'tiktokApi', name: 'TikTok Content API', vendor: 'TikTok', via: 'platform' },
  youtubeApi: { id: 'youtubeApi', name: 'YouTube Data API', vendor: 'Google', via: 'platform' },
  whatsappApi: { id: 'whatsappApi', name: 'WhatsApp Cloud API', vendor: 'Meta', via: 'platform' },
  metaAds: { id: 'metaAds', name: 'Meta Marketing API', vendor: 'Meta', via: 'platform' },
  tiktokAds: { id: 'tiktokAds', name: 'TikTok Ads API', vendor: 'TikTok', via: 'platform' },
};

export const viaLabels: Record<ToolVia, Text> = {
  fal: { ar: 'عبر fal.ai', en: 'via fal.ai' },
  server: { ar: 'على خادمنا', en: 'on our server' },
  platform: { ar: 'الواجهة الرسمية للمنصة', en: "the platform's official API" },
};

export type LineItem = {
  // What the step does, in the customer's words.
  task: Text;
  tools: ToolId[];
  cost: number;
};

export type TierSpec = {
  id: Tier;
  name: Text;
  summary: Text;
  deliveryHours: number;
  resolution: string;
  items: LineItem[];
  serviceFee: number;
};

const base: LineItem[] = [
  { task: { ar: 'كتابة الفكرة والسكربت والكابشن', en: 'Idea, script and caption' }, tools: ['claude'], cost: 250 },
  { task: { ar: 'الترجمة المكتوبة على الشاشة', en: 'On-screen captions' }, tools: ['claude', 'ffmpeg'], cost: 250 },
  { task: { ar: 'المونتاج والقص', en: 'Editing and trimming' }, tools: ['ffmpeg'], cost: 500 },
  { task: { ar: 'موسيقى مؤلفة للريل', en: 'Music composed for the reel' }, tools: ['lyria'], cost: 750 },
];

export const tiers: Record<Tier, TierSpec> = {
  basic: {
    id: 'basic',
    name: { ar: 'أساسي', en: 'Basic' },
    summary: { ar: 'قص ومونتاج نظيف مع ترجمة وموسيقى', en: 'Clean cut and edit with captions and music' },
    deliveryHours: 2,
    resolution: '1080p',
    items: base,
    serviceFee: 8250,
  },
  pro: {
    id: 'pro',
    name: { ar: 'احترافي', en: 'Pro' },
    summary: { ar: 'تعليق صوتي، تصحيح ألوان وتثبيت، وغلاف مصمم', en: 'Voice-over, color correction, stabilization and a designed cover' },
    deliveryHours: 6,
    resolution: '1080p',
    items: [
      ...base,
      { task: { ar: 'تعليق صوتي بالعربي', en: 'Arabic voice-over' }, tools: ['elevenlabs'], cost: 250 },
      { task: { ar: 'تصحيح الألوان وتثبيت الاهتزاز', en: 'Color correction and stabilization' }, tools: ['ffmpeg'], cost: 250 },
      { task: { ar: 'تصميم صورة الغلاف', en: 'Cover image design' }, tools: ['geminiImage'], cost: 250 },
    ],
    serviceFee: 17500,
  },
  premium: {
    id: 'premium',
    name: { ar: 'متقدم', en: 'Premium' },
    summary: { ar: 'لقطة افتتاحية مولّدة بالذكاء الاصطناعي ودقة 4K ونسختان للمقارنة', en: 'AI-generated opening shot, 4K, and two versions to compare' },
    deliveryHours: 24,
    resolution: '4K',
    items: [
      ...base,
      { task: { ar: 'تعليق صوتي بالعربي', en: 'Arabic voice-over' }, tools: ['elevenlabs'], cost: 250 },
      { task: { ar: 'رفع الدقة إلى 4K', en: 'Upscaling to 4K' }, tools: ['upscale'], cost: 1500 },
      { task: { ar: 'تصميم صورة الغلاف', en: 'Cover image design' }, tools: ['geminiImage'], cost: 250 },
      { task: { ar: 'لقطة افتتاحية مولّدة بالذكاء الاصطناعي', en: 'AI-generated opening shot' }, tools: ['veo'], cost: 2500 },
      { task: { ar: 'نسخة ثانية بافتتاحية مختلفة للمقارنة', en: 'A second version with a different opening' }, tools: ['claude', 'ffmpeg'], cost: 500 },
    ],
    serviceFee: 33250,
  },
};

export const tierOrder: Tier[] = ['basic', 'pro', 'premium'];

export function toolsCost(tier: Tier): number {
  return tiers[tier].items.reduce((sum, item) => sum + item.cost, 0);
}

export function reelPrice(tier: Tier): number {
  return toolsCost(tier) + tiers[tier].serviceFee;
}

// Promotion: a daily budget paid to the ad platform, shown separately from
// the reel price because it goes to Meta or TikTok, not to us.
export type PromoLevel = 'none' | 'low' | 'mid' | 'high';

export const promoLevels: Record<PromoLevel, { name: Text; daily: number }> = {
  none: { name: { ar: 'بدون ترويج', en: 'No promotion' }, daily: 0 },
  low: { name: { ar: 'منخفض', en: 'Low' }, daily: 5000 },
  mid: { name: { ar: 'متوسط', en: 'Medium' }, daily: 12000 },
  high: { name: { ar: 'عالٍ', en: 'High' }, daily: 25000 },
};

export const promoOrder: PromoLevel[] = ['none', 'low', 'mid', 'high'];

// Rough reach per 1,000 dinars for local food and retail in Iraq; replaced by
// the ad platform's own estimate once the account is connected.
const REACH_PER_THOUSAND = 180;

export function promotionCost(level: PromoLevel, days: number): number {
  return promoLevels[level].daily * Math.max(0, Math.round(days));
}

export function estimatedReach(spend: number): { low: number; high: number } {
  const mid = (spend / 1000) * REACH_PER_THOUSAND;
  return { low: Math.round((mid * 0.8) / 100) * 100, high: Math.round((mid * 1.25) / 100) * 100 };
}

export function estimatedOrders(spend: number, costPerOrder: number): { low: number; high: number } {
  if (spend <= 0 || costPerOrder <= 0) return { low: 0, high: 0 };
  const mid = spend / costPerOrder;
  return { low: Math.floor(mid * 0.7), high: Math.ceil(mid * 1.2) };
}

// Monthly plan: reels bought ahead are cheaper.
export const planSizes = [4, 8, 12, 20] as const;
export type PlanSize = (typeof planSizes)[number];

export function planDiscount(reels: number): number {
  if (reels >= 20) return 0.2;
  if (reels >= 12) return 0.15;
  if (reels >= 8) return 0.1;
  return 0;
}

export function planPrice(reels: number, tier: Tier): { full: number; discount: number; total: number; perReel: number } {
  const full = reelPrice(tier) * reels;
  const discount = Math.round((full * planDiscount(reels)) / 500) * 500;
  const total = full - discount;
  return { full, discount, total, perReel: reels > 0 ? Math.round(total / reels) : 0 };
}
