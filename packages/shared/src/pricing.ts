// Reel pricing. Every price is the sum of the AI work it pays for plus the
// service fee, so the app can always show the customer why a reel costs what
// it costs. Tool costs follow OpenRouter's listed rates for one 15-second
// reel; amounts are Iraqi dinars and are sample values until pricing is
// approved.

export type Tier = 'basic' | 'pro' | 'premium';

export type ToolId =
  | 'claude'
  | 'lyria'
  | 'elevenlabs'
  | 'geminiImage'
  | 'veo'
  | 'fluxUpscale'
  | 'ffmpeg'
  | 'metaApi'
  | 'tiktokApi'
  | 'youtubeApi'
  | 'whatsappApi'
  | 'metaAds'
  | 'tiktokAds';

// How each tool is reached: one OpenRouter key for every AI model, our own
// server for editing, and each platform's official API for publishing.
export type ToolVia = 'openrouter' | 'server' | 'platform';

export type Tool = { id: ToolId; name: string; vendor: string; via: ToolVia; model?: string };

export const tools: Record<ToolId, Tool> = {
  claude: { id: 'claude', name: 'Claude Sonnet 5.5', vendor: 'Anthropic', via: 'openrouter', model: 'anthropic/claude-sonnet-5.5' },
  lyria: { id: 'lyria', name: 'Lyria 3', vendor: 'Google', via: 'openrouter', model: 'google/lyria-3-clip-preview' },
  elevenlabs: { id: 'elevenlabs', name: 'ElevenLabs v4', vendor: 'ElevenLabs', via: 'openrouter', model: 'elevenlabs/eleven-v4-turbo' },
  geminiImage: { id: 'geminiImage', name: 'Gemini Image', vendor: 'Google', via: 'openrouter', model: 'google/gemini-3.1-flash-image' },
  veo: { id: 'veo', name: 'Veo 3.1 Fast', vendor: 'Google', via: 'openrouter', model: 'google/veo-3.1-fast' },
  fluxUpscale: { id: 'fluxUpscale', name: 'FLUX Video Upscale', vendor: 'Black Forest Labs', via: 'openrouter', model: 'black-forest-labs/flux-video-upscale' },
  ffmpeg: { id: 'ffmpeg', name: 'ffmpeg', vendor: 'سيرفر SQ', via: 'server' },
  metaApi: { id: 'metaApi', name: 'Meta Graph API', vendor: 'Meta', via: 'platform' },
  tiktokApi: { id: 'tiktokApi', name: 'TikTok Content API', vendor: 'TikTok', via: 'platform' },
  youtubeApi: { id: 'youtubeApi', name: 'YouTube Data API', vendor: 'Google', via: 'platform' },
  whatsappApi: { id: 'whatsappApi', name: 'WhatsApp Cloud API', vendor: 'Meta', via: 'platform' },
  metaAds: { id: 'metaAds', name: 'Meta Marketing API', vendor: 'Meta', via: 'platform' },
  tiktokAds: { id: 'tiktokAds', name: 'TikTok Ads API', vendor: 'TikTok', via: 'platform' },
};

export const viaLabels: Record<ToolVia, string> = {
  openrouter: 'عبر OpenRouter',
  server: 'على سيرفرنا',
  platform: 'واجهة المنصة الرسمية',
};

export type LineItem = {
  // What the step does, in the customer's words.
  task: string;
  tools: ToolId[];
  cost: number;
};

export type TierSpec = {
  id: Tier;
  name: string;
  summary: string;
  deliveryHours: number;
  resolution: string;
  items: LineItem[];
  serviceFee: number;
};

const base: LineItem[] = [
  { task: 'كتابة الفكرة والسكربت والكابشن', tools: ['claude'], cost: 250 },
  { task: 'الترجمة المكتوبة على الشاشة', tools: ['claude', 'ffmpeg'], cost: 250 },
  { task: 'المونتاج والقص', tools: ['ffmpeg'], cost: 500 },
  { task: 'موسيقى مؤلفة للريل', tools: ['lyria'], cost: 750 },
];

export const tiers: Record<Tier, TierSpec> = {
  basic: {
    id: 'basic',
    name: 'أساسي',
    summary: 'قص ومونتاج نظيف مع ترجمة وموسيقى',
    deliveryHours: 2,
    resolution: '1080p',
    items: base,
    serviceFee: 8250,
  },
  pro: {
    id: 'pro',
    name: 'احترافي',
    summary: 'تعليق صوتي، تصحيح ألوان وتثبيت، وغلاف مصمم',
    deliveryHours: 6,
    resolution: '1080p',
    items: [
      ...base,
      { task: 'تعليق صوتي بالعربي', tools: ['elevenlabs'], cost: 250 },
      { task: 'تصحيح الألوان وتثبيت الاهتزاز', tools: ['ffmpeg'], cost: 250 },
      { task: 'تصميم صورة الغلاف', tools: ['geminiImage'], cost: 250 },
    ],
    serviceFee: 17500,
  },
  premium: {
    id: 'premium',
    name: 'متقدم',
    summary: 'لقطة افتتاحية مولّدة بالذكاء الاصطناعي ودقة 4K ونسختان للمقارنة',
    deliveryHours: 24,
    resolution: '4K',
    items: [
      ...base,
      { task: 'تعليق صوتي بالعربي', tools: ['elevenlabs'], cost: 250 },
      { task: 'رفع الدقة إلى 4K', tools: ['fluxUpscale'], cost: 1500 },
      { task: 'تصميم صورة الغلاف', tools: ['geminiImage'], cost: 250 },
      { task: 'لقطة افتتاحية مولّدة بالذكاء الاصطناعي', tools: ['veo'], cost: 2500 },
      { task: 'نسخة ثانية بافتتاحية مختلفة للمقارنة', tools: ['claude', 'ffmpeg'], cost: 500 },
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

export const promoLevels: Record<PromoLevel, { name: string; daily: number }> = {
  none: { name: 'بدون ترويج', daily: 0 },
  low: { name: 'منخفض', daily: 5000 },
  mid: { name: 'متوسط', daily: 12000 },
  high: { name: 'عالي', daily: 25000 },
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
