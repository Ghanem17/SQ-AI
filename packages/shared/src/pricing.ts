// Reel pricing. Every price is the sum of the AI work it pays for plus the
// service fee, so the app can always show the customer why a reel costs what
// it costs. Amounts are Iraqi dinars and are sample values until the pricing
// is approved.

export type Tier = 'basic' | 'pro' | 'premium';

export type ToolId =
  | 'claude'
  | 'whisper'
  | 'shotstack'
  | 'suno'
  | 'elevenlabs'
  | 'topaz'
  | 'flux'
  | 'runway'
  | 'metaApi'
  | 'tiktokApi'
  | 'youtubeApi'
  | 'whatsappApi'
  | 'metaAds'
  | 'tiktokAds';

export type Tool = { id: ToolId; name: string; vendor: string };

export const tools: Record<ToolId, Tool> = {
  claude: { id: 'claude', name: 'Claude', vendor: 'Anthropic' },
  whisper: { id: 'whisper', name: 'Whisper', vendor: 'OpenAI' },
  shotstack: { id: 'shotstack', name: 'Shotstack', vendor: 'Shotstack' },
  suno: { id: 'suno', name: 'Suno', vendor: 'Suno' },
  elevenlabs: { id: 'elevenlabs', name: 'ElevenLabs', vendor: 'ElevenLabs' },
  topaz: { id: 'topaz', name: 'Topaz Video AI', vendor: 'Topaz Labs' },
  flux: { id: 'flux', name: 'FLUX', vendor: 'Black Forest Labs' },
  runway: { id: 'runway', name: 'Runway', vendor: 'Runway' },
  metaApi: { id: 'metaApi', name: 'Meta Graph API', vendor: 'Meta' },
  tiktokApi: { id: 'tiktokApi', name: 'TikTok Content API', vendor: 'TikTok' },
  youtubeApi: { id: 'youtubeApi', name: 'YouTube Data API', vendor: 'Google' },
  whatsappApi: { id: 'whatsappApi', name: 'WhatsApp Cloud API', vendor: 'Meta' },
  metaAds: { id: 'metaAds', name: 'Meta Marketing API', vendor: 'Meta' },
  tiktokAds: { id: 'tiktokAds', name: 'TikTok Ads API', vendor: 'TikTok' },
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
  { task: 'كتابة الفكرة والسكربت والكابشن', tools: ['claude'], cost: 1000 },
  { task: 'تفريغ الصوت والترجمة على الشاشة', tools: ['whisper'], cost: 500 },
  { task: 'المونتاج والقص التلقائي', tools: ['shotstack'], cost: 2500 },
  { task: 'موسيقى مرخّصة للريل', tools: ['suno'], cost: 1000 },
];

export const tiers: Record<Tier, TierSpec> = {
  basic: {
    id: 'basic',
    name: 'أساسي',
    summary: 'قص ومونتاج نظيف مع ترجمة وموسيقى',
    deliveryHours: 2,
    resolution: '1080p',
    items: base,
    serviceFee: 10000,
  },
  pro: {
    id: 'pro',
    name: 'احترافي',
    summary: 'تعليق صوتي، تصحيح ألوان وتثبيت، وغلاف مصمم',
    deliveryHours: 6,
    resolution: '1080p',
    items: [
      ...base,
      { task: 'تعليق صوتي بلهجة محلية', tools: ['elevenlabs'], cost: 3000 },
      { task: 'تصحيح الألوان وتثبيت الاهتزاز', tools: ['topaz'], cost: 4000 },
      { task: 'تصميم صورة الغلاف', tools: ['flux'], cost: 1500 },
    ],
    serviceFee: 21500,
  },
  premium: {
    id: 'premium',
    name: 'متقدم',
    summary: 'لقطات مولّدة بالذكاء الاصطناعي ودقة 4K ونسختان للمقارنة',
    deliveryHours: 24,
    resolution: '4K',
    items: [
      ...base,
      { task: 'تعليق صوتي بلهجة محلية', tools: ['elevenlabs'], cost: 3000 },
      { task: 'تصحيح الألوان والرفع إلى 4K', tools: ['topaz'], cost: 7000 },
      { task: 'تصميم صورة الغلاف', tools: ['flux'], cost: 1500 },
      { task: 'لقطات افتتاحية مولّدة بالذكاء الاصطناعي', tools: ['runway'], cost: 18000 },
      { task: 'نسخة ثانية بافتتاحية مختلفة للمقارنة', tools: ['claude', 'shotstack'], cost: 3500 },
    ],
    serviceFee: 37000,
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
