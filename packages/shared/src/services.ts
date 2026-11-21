// One-off services: a customer describes what they want, picks a level
// (low, medium, high), and the app prices the exact AI models that level
// uses from their real per-unit costs plus the owner's margin. The customer
// sees every model and its cost before agreeing.

import { count } from './plural.ts';

export type Lang = 'ar' | 'en';
export type Bilingual = { ar: string; en: string };

export type ServiceKind = 'copy' | 'voice' | 'adImage' | 'editVideo' | 'textVideo' | 'imageVideo';
export type ServiceTier = 'low' | 'mid' | 'high';
export const serviceTiers: ServiceTier[] = ['low', 'mid', 'high'];

export type ServiceToolKey =
  | 'claudeHaiku'
  | 'claude'
  | 'claudeOpus'
  | 'imageLite'
  | 'image'
  | 'wanVideo'
  | 'klingVideo'
  | 'veoVideo'
  | 'refVideoLite'
  | 'refVideo'
  | 'refVideoPro'
  | 'voiceTurbo'
  | 'voice'
  | 'voiceV3'
  | 'music'
  | 'musicPro'
  | 'captions'
  | 'captionsPro'
  | 'musicUnder'
  | 'upscale'
  | 'trim'
  | 'mergeAudio';

export type ServiceTool = {
  key: ServiceToolKey;
  name: string;
  vendor: string;
  // The fal endpoint that runs it; live prices are looked up by this id.
  endpoint: string;
  // False for chat models, which fal bills per token rather than per unit.
  livePrice: boolean;
  // The chat model id behind fal's router, for chat tools.
  model?: string;
  unit: Bilingual;
  // fal's list price per unit in US dollars, used until live prices load.
  usd: number;
  does: Bilingual;
};

const t = (key: ServiceToolKey, name: string, vendor: string, endpoint: string, usd: number, unit: Bilingual, does: Bilingual, model?: string): ServiceTool => ({
  key,
  name,
  vendor,
  endpoint,
  usd,
  unit,
  does,
  livePrice: !model,
  model,
});

const ROUTER = 'openrouter/router/openai/v1/chat/completions';
const U = {
  request: { ar: 'طلب', en: 'request' },
  image: { ar: 'صورة', en: 'image' },
  second: { ar: 'ثانية', en: 'second' },
  chars: { ar: '1000 حرف', en: '1,000 characters' },
  clip: { ar: 'مقطع 30 ثانية', en: '30-second clip' },
  minute: { ar: 'دقيقة', en: 'minute' },
  video: { ar: 'فيديو', en: 'video' },
  job: { ar: 'عملية', en: 'operation' },
};

export const serviceTools: Record<ServiceToolKey, ServiceTool> = {
  claudeHaiku: t('claudeHaiku', 'Claude Haiku 5.5', 'Anthropic', ROUTER, 0.003, U.request, { ar: 'كتابة سريعة واقتصادية', en: 'Fast, economical writing' }, 'anthropic/claude-haiku-5.5'),
  claude: t('claude', 'Claude Sonnet 5.5', 'Anthropic', ROUTER, 0.01, U.request, { ar: 'فهم الطلب وكتابة متقنة', en: 'Understanding requests and careful writing' }, 'anthropic/claude-sonnet-5.5'),
  claudeOpus: t('claudeOpus', 'Claude Opus 5.5', 'Anthropic', ROUTER, 0.03, U.request, { ar: 'أعلى جودة في الكتابة والتخطيط', en: 'Top-quality writing and planning' }, 'anthropic/claude-opus-5.5'),
  imageLite: t('imageLite', 'Nano Banana', 'Google', 'fal-ai/nano-banana/edit', 0.0398, U.image, { ar: 'تصميم سريع من صورتك', en: 'Quick design from your photo' }),
  image: t('image', 'Nano Banana Pro', 'Google', 'fal-ai/nano-banana-pro/edit', 0.15, U.image, { ar: 'تصميم احترافي من صورتك', en: 'Professional design from your photo' }),
  wanVideo: t('wanVideo', 'Wan 2.2', 'Alibaba', 'fal-ai/wan/v2.2-a14b/text-to-video', 0.08, U.second, { ar: 'توليد فيديو اقتصادي بدقة 720p', en: 'Economical 720p video generation' }),
  klingVideo: t('klingVideo', 'Kling 3 Pro', 'Kuaishou', 'fal-ai/kling-video/v3/pro/text-to-video', 0.14, U.second, { ar: 'توليد فيديو احترافي حتى 15 ثانية', en: 'Professional video up to 15 seconds' }),
  refVideoLite: t('refVideoLite', 'Kling O1', 'Kuaishou', 'fal-ai/kling-video/o1/standard/reference-to-video', 0.084, U.second, {
    ar: 'فيديو من صورك بحركة طبيعية',
    en: 'Video from your photos with natural motion',
  }),
  refVideo: t('refVideo', 'Wan 2.7', 'Alibaba', 'fal-ai/wan/v2.7/reference-to-video', 0.1, U.second, {
    ar: 'فيديو من صورك بدقة 1080p',
    en: '1080p video from your photos',
  }),
  refVideoPro: t('refVideoPro', 'Kling O3 Pro', 'Kuaishou', 'fal-ai/kling-video/o3/pro/reference-to-video', 0.14, U.second, {
    ar: 'فيديو احترافي من صورك مع صوت أصلي',
    en: 'Professional video from your photos with native sound',
  }),
  veoVideo: t('veoVideo', 'Veo 3.1', 'Google', 'fal-ai/veo3.1', 0.4, U.second, { ar: 'فيديو سينمائي بصوت أصلي بدقة 1080p', en: 'Cinematic 1080p video with native sound' }),
  voiceTurbo: t('voiceTurbo', 'ElevenLabs Turbo 2.5', 'ElevenLabs', 'fal-ai/elevenlabs/tts/turbo-v2.5', 0.05, U.chars, { ar: 'صوت واضح وسريع', en: 'Clear, fast voice' }),
  voice: t('voice', 'ElevenLabs v4', 'ElevenLabs', 'fal-ai/elevenlabs/tts/eleven-v4', 0.08, U.chars, { ar: 'صوت طبيعي بنبرة متوازنة', en: 'Natural, balanced voice' }),
  voiceV3: t('voiceV3', 'ElevenLabs v3', 'ElevenLabs', 'fal-ai/elevenlabs/tts/eleven-v3', 0.1, U.chars, { ar: 'أكثر الأصوات تعبيرًا وإحساسًا', en: 'The most expressive voice' }),
  music: t('music', 'Lyria 2', 'Google', 'fal-ai/lyria2', 0.1, U.clip, { ar: 'موسيقى مؤلفة للفيديو', en: 'Composed music for the video' }),
  musicPro: t('musicPro', 'ElevenLabs Music', 'ElevenLabs', 'fal-ai/elevenlabs/music', 0.6, U.minute, { ar: 'موسيقى بجودة استوديو على طول الفيديو', en: 'Studio-quality music to the video length' }),
  captions: t('captions', 'Auto Subtitle', 'fal', 'fal-ai/workflow-utilities/auto-subtitle', 0.03, U.minute, {
    ar: 'نص مكتوب لكلامك على الفيديو، الكلمة المنطوقة ملوّنة',
    en: 'Your speech as on-screen captions, the spoken word highlighted',
  }),
  captionsPro: t('captionsPro', 'VEED Subtitles', 'VEED', 'veed/subtitles', 0.1, U.minute, {
    ar: 'نص مكتوب لكلامك، ويُترجم إلى لغة أخرى عند الطلب',
    en: 'Captions of your speech, translated on request',
  }),
  musicUnder: t('musicUnder', 'Sonilo Video Music', 'Sonilo', 'sonilo/v1.1/video-to-video-music', 0.009, U.second, {
    ar: 'موسيقى على إيقاع الفيديو تنخفض تحت صوتك الأصلي',
    en: 'Music scored to the video that dips under your own voice',
  }),
  upscale: t('upscale', 'Topaz Video Upscale', 'Topaz Labs', 'fal-ai/topaz/upscale/video', 0.01, U.second, { ar: 'رفع الدقة وتحسين الوضوح', en: 'Higher resolution and sharper detail' }),
  trim: t('trim', 'Trim', 'fal', 'fal-ai/workflow-utilities/trim-video', 0.001, U.job, { ar: 'قص البداية والنهاية', en: 'Trims the start and end' }),
  mergeAudio: t('mergeAudio', 'Audio merge', 'fal', 'fal-ai/ffmpeg-api/merge-audio-video', 0.0002, U.second, { ar: 'دمج الصوت مع الفيديو', en: 'Merges the audio into the video' }),
};

export const serviceToolKeys = Object.keys(serviceTools) as ServiceToolKey[];

export type ServiceInfo = { kind: ServiceKind; name: Bilingual; pitch: Bilingual; needs: 'video' | 'image' | null };

export const services: Record<ServiceKind, ServiceInfo> = {
  editVideo: {
    kind: 'editVideo',
    name: { ar: 'مونتاج فيديوك', en: 'Edit your video' },
    pitch: { ar: 'قص ونص مكتوب لكلامك، وموسيقى إن طلبتها', en: 'Trims, captions of your speech, and music if you ask' },
    needs: 'video',
  },
  adImage: {
    kind: 'adImage',
    name: { ar: 'إعلان من صورة', en: 'Ad from a photo' },
    pitch: { ar: 'تتحول صورة منتجك إلى تصميم إعلان', en: 'Your product photo becomes an ad' },
    needs: 'image',
  },
  imageVideo: {
    kind: 'imageVideo',
    name: { ar: 'فيديو من صور', en: 'Video from photos' },
    pitch: { ar: 'ارفع حتى 4 صور لمنتجك ونحوّلها إلى فيديو', en: 'Upload up to 4 photos and we turn them into a video' },
    needs: 'image',
  },
  textVideo: {
    kind: 'textVideo',
    name: { ar: 'فيديو من نص', en: 'Video from text' },
    pitch: { ar: 'صف الفيديو ونولّده بمشاهد وموسيقى', en: 'Describe it; we make scenes and music' },
    needs: null,
  },
  copy: {
    kind: 'copy',
    name: { ar: 'كتابة محتوى', en: 'Copywriting' },
    pitch: { ar: 'منشور أو نص إعلان أو خطة محتوى لشهر', en: 'A post, ad copy, or a month of content' },
    needs: null,
  },
  voice: {
    kind: 'voice',
    name: { ar: 'تعليق صوتي', en: 'Voice-over' },
    pitch: { ar: 'يتحول نصك إلى صوت عربي طبيعي', en: 'Your text becomes a natural voice' },
    needs: null,
  },
};

export const serviceOrder: ServiceKind[] = ['editVideo', 'imageVideo', 'adImage', 'textVideo', 'copy', 'voice'];

// How many photos a video-from-photos order can use.
export const MAX_REFERENCE_IMAGES = 4;

// The longest video and the largest file the app accepts. fal's trim tool
// takes files up to 500 MB, so nothing larger can be edited.
export const MAX_VIDEO_SECONDS = 180;
export const MAX_UPLOAD_BYTES = 500_000_000;
// The quick caption tool takes files up to 100 MB; larger videos are
// captioned by VEED, which has no such limit.
export const QUICK_CAPTIONS_MAX_BYTES = 100_000_000;

// Languages captions can be translated into, with VEED's codes. Captions
// otherwise stay in the language that is spoken.
export const captionLanguages = {
  ar: { code: 'ar-SA', name: { ar: 'العربية', en: 'Arabic' } },
  en: { code: 'en-US', name: { ar: 'الإنجليزية', en: 'English' } },
  ckb: { code: 'ckb-IQ', name: { ar: 'الكردية السورانية', en: 'Kurdish (Sorani)' } },
  ku: { code: 'ku', name: { ar: 'الكردية الكرمانجية', en: 'Kurdish (Kurmanji)' } },
  tr: { code: 'tr-TR', name: { ar: 'التركية', en: 'Turkish' } },
  fa: { code: 'fa-IR', name: { ar: 'الفارسية', en: 'Persian' } },
  fr: { code: 'fr-FR', name: { ar: 'الفرنسية', en: 'French' } },
  de: { code: 'de-DE', name: { ar: 'الألمانية', en: 'German' } },
  es: { code: 'es-ES', name: { ar: 'الإسبانية', en: 'Spanish' } },
  ru: { code: 'ru-RU', name: { ar: 'الروسية', en: 'Russian' } },
  zh: { code: 'zh', name: { ar: 'الصينية', en: 'Chinese' } },
  ur: { code: 'ur-PK', name: { ar: 'الأردية', en: 'Urdu' } },
} as const satisfies Record<string, { code: string; name: Bilingual }>;
export type CaptionLanguage = keyof typeof captionLanguages;
export const captionLanguageKeys = Object.keys(captionLanguages) as CaptionLanguage[];

// The spoken language VEED transcribes, from the account's language: Iraqi
// Arabic or English.
export const spokenLanguage: Record<Lang, string> = { ar: 'ar-IQ', en: 'en-US' };

export const tierNames: Record<ServiceTier, Bilingual> = {
  low: { ar: 'منخفض', en: 'Low' },
  mid: { ar: 'متوسط', en: 'Medium' },
  high: { ar: 'عالٍ', en: 'High' },
};

// What changes between levels for each service, in the customer's words.
export const tierQuality: Record<ServiceKind, Record<ServiceTier, Bilingual>> = {
  imageVideo: {
    low: { ar: '5 ثوانٍ تحرّك صورك بشكل طبيعي', en: '5 seconds that bring your photos to life' },
    mid: { ar: 'حتى 10 ثوانٍ بدقة 1080p', en: 'Up to 10 seconds at 1080p' },
    high: { ar: 'حتى 15 ثانية بجودة احترافية مع صوت أصلي', en: 'Up to 15 s, professional, with native sound' },
  },
  textVideo: {
    low: { ar: '5 ثوانٍ بدقة 720p للتجربة والمنشورات السريعة', en: '5 seconds at 720p, for tests and quick posts' },
    mid: { ar: 'حتى 15 ثانية بجودة احترافية وحركة أكثر سلاسة', en: 'Up to 15 s, professional, smoother motion' },
    high: { ar: 'حتى 8 ثوانٍ بجودة سينمائية 1080p مع صوت أصلي', en: 'Up to 8 s, cinematic 1080p with native sound' },
  },
  adImage: {
    low: { ar: 'تصميم واحد سريع بجودة جيدة', en: 'One quick design, good quality' },
    mid: { ar: 'تصميم احترافي بتفاصيل ونص أدق', en: 'Professional design, sharper detail and text' },
    high: { ar: 'نسختان احترافيتان بدقة 2K لتختار الأفضل', en: 'Two professional 2K versions to choose from' },
  },
  voice: {
    low: { ar: 'صوت واضح وسريع للاستخدام اليومي', en: 'A clear, fast voice for everyday use' },
    mid: { ar: 'صوت طبيعي بنبرة متوازنة', en: 'A natural voice with balanced tone' },
    high: { ar: 'أكثر الأصوات تعبيرًا، مناسب للإعلانات', en: 'The most expressive voice, made for ads' },
  },
  copy: {
    low: { ar: 'نص جيد وسريع', en: 'Good, fast copy' },
    mid: { ar: 'نص متقن بأسلوب تسويقي', en: 'Polished marketing copy' },
    high: { ar: 'أعلى جودة في الصياغة والأفكار', en: 'The best writing and ideas' },
  },
  editVideo: {
    low: { ar: 'تنفيذ طلباتك كما طلبتها', en: 'Your edits as asked' },
    mid: { ar: 'تنفيذ طلباتك مع موسيقى استوديو إن طلبتها', en: 'Your edits, with studio music if you asked for it' },
    high: { ar: 'طلباتك مع رفع الدقة وتحسين الوضوح', en: 'Your edits plus a sharper, upscaled video' },
  },
};

export type PlanLine = { tool: ServiceToolKey; qty: number; task: Bilingual };

export type PricingSettings = {
  // Dinars per US dollar.
  usdToIqd: number;
  // Margin on top of the tools' cost, e.g. 0.6 for 60%.
  markup: number;
  // No order is priced below this, in dinars.
  minPrice: number;
};

export const defaultPricing: PricingSettings = { usdToIqd: 1500, markup: 0.6, minPrice: 3000 };

export type QuoteLine = PlanLine & { unitUsd: number; costUsd: number; costIqd: number };

export type Quote = {
  lines: QuoteLine[];
  toolsUsd: number;
  toolsIqd: number;
  feeIqd: number;
  totalIqd: number;
};

const roundUp = (n: number, step: number) => Math.ceil(n / step) * step;

// The minimum order price grows with the level, so the three levels stay
// distinct even for small jobs whose tools cost almost nothing.
export const tierMinFactor: Record<ServiceTier, number> = { low: 1, mid: 1.5, high: 2.5 };

// Prices a plan. `prices` overrides the per-unit dollar cost of any tool
// (live prices from fal, or the owner's own numbers).
export function quote(
  lines: PlanLine[],
  settings: PricingSettings = defaultPricing,
  prices: Partial<Record<ServiceToolKey, number>> = {},
  tier: ServiceTier = 'low',
): Quote {
  const priced: QuoteLine[] = lines
    .filter((l) => serviceTools[l.tool] && l.qty > 0)
    .map((l) => {
      const unitUsd = prices[l.tool] ?? serviceTools[l.tool].usd;
      const costUsd = unitUsd * l.qty;
      return { ...l, unitUsd, costUsd, costIqd: Math.round(costUsd * settings.usdToIqd) };
    });
  const toolsUsd = priced.reduce((s, l) => s + l.costUsd, 0);
  const toolsIqd = Math.round(toolsUsd * settings.usdToIqd);
  const minimum = roundUp(settings.minPrice * tierMinFactor[tier], 250);
  const totalIqd = Math.max(minimum, roundUp(toolsIqd * (1 + settings.markup), 250));
  return { lines: priced, toolsUsd, toolsIqd, feeIqd: totalIqd - toolsIqd, totalIqd };
}

export function formatUsd(n: number): string {
  if (n === 0) return '$0';
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

// What the assistant extracts from the conversation for each service. The
// tools and quantities are then derived from these, never guessed by the
// model, so the price always matches what will actually run.
export type ServiceParams =
  | { kind: 'copy'; format: 'post' | 'ad' | 'plan'; topic: string; details: string }
  | { kind: 'voice'; text: string; voice: 'brian' | 'sarah' }
  | { kind: 'adImage'; prompt: string; aspect: '1:1' | '4:5' | '9:16' }
  | {
      kind: 'editVideo';
      trimStart: number | null;
      trimEnd: number | null;
      captions: boolean;
      // null keeps the captions in the spoken language.
      captionLanguage: CaptionLanguage | null;
      music: string | null;
      // 'under' keeps the customer's voice and plays the music quietly
      // beneath it; 'replace' swaps the original sound for the music.
      musicMode: 'under' | 'replace';
    }
  | { kind: 'textVideo'; prompt: string; duration: number; music: string | null }
  | { kind: 'imageVideo'; prompt: string; duration: number; music: string | null };

export const VIDEO_SECONDS = { min: 3, max: 15 } as const;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// Normalizes model output into safe, runnable parameters (or null).
export function cleanParams(raw: unknown): ServiceParams | null {
  const p = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown, max = 1500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  switch (p.kind) {
    case 'copy': {
      const format = p.format === 'ad' || p.format === 'plan' ? p.format : 'post';
      const topic = str(p.topic, 300);
      return topic ? { kind: 'copy', format, topic, details: str(p.details) } : null;
    }
    case 'voice': {
      const text = str(p.text, 3000);
      return text ? { kind: 'voice', text, voice: p.voice === 'sarah' ? 'sarah' : 'brian' } : null;
    }
    case 'adImage': {
      const prompt = str(p.prompt, 1200);
      const aspect = p.aspect === '4:5' || p.aspect === '9:16' ? p.aspect : '1:1';
      return prompt ? { kind: 'adImage', prompt, aspect } : null;
    }
    case 'editVideo': {
      const trimStart = num(p.trimStart);
      const trimEnd = num(p.trimEnd);
      const captionLanguage = captionLanguageKeys.find((k) => k === p.captionLanguage) ?? null;
      // A translation is a kind of captions, so asking for one turns them on.
      const captions = p.captions === true || captionLanguage !== null;
      return {
        kind: 'editVideo',
        trimStart: trimStart !== null && trimStart > 0 ? trimStart : null,
        trimEnd: trimEnd !== null && trimEnd > 0 ? trimEnd : null,
        captions,
        captionLanguage: captions ? captionLanguage : null,
        music: str(p.music, 400) || null,
        musicMode: p.musicMode === 'replace' ? 'replace' : 'under',
      };
    }
    case 'textVideo':
    case 'imageVideo': {
      const prompt = str(p.prompt, 1500);
      const duration = Math.round(clamp(num(p.duration) ?? 5, VIDEO_SECONDS.min, VIDEO_SECONDS.max));
      return prompt ? { kind: p.kind === 'imageVideo' ? 'imageVideo' : 'textVideo', prompt, duration, music: str(p.music, 400) || null } : null;
    }
    default:
      return null;
  }
}

// The video length a level actually produces: Wan makes a fixed 5 seconds,
// Veo 4, 6 or 8, Kling what was asked between 3 and 15.
export function videoSeconds(requested: number, tier: ServiceTier): number {
  if (tier === 'low') return 5;
  if (tier === 'high') return requested <= 4 ? 4 : requested <= 6 ? 6 : 8;
  return Math.round(clamp(requested, VIDEO_SECONDS.min, VIDEO_SECONDS.max));
}

// Video from photos: Kling O1 makes 5 seconds, Wan 2.7 up to 10, Kling O3
// Pro up to 15.
export function photoVideoSeconds(requested: number, tier: ServiceTier): number {
  if (tier === 'low') return 5;
  if (tier === 'mid') return Math.round(clamp(requested, 2, 10));
  return Math.round(clamp(requested, VIDEO_SECONDS.min, VIDEO_SECONDS.max));
}

// The tools each level uses, by role.
export const tierTools = {
  writer: { low: 'claudeHaiku', mid: 'claude', high: 'claudeOpus' },
  image: { low: 'imageLite', mid: 'image', high: 'image' },
  video: { low: 'wanVideo', mid: 'klingVideo', high: 'veoVideo' },
  photoVideo: { low: 'refVideoLite', mid: 'refVideo', high: 'refVideoPro' },
  voice: { low: 'voiceTurbo', mid: 'voice', high: 'voiceV3' },
  music: { low: 'music', mid: 'musicPro', high: 'musicPro' },
} as const satisfies Record<string, Record<ServiceTier, ServiceToolKey>>;

const task = (ar: string, en: string): Bilingual => ({ ar, en });

// Captions run on the quick tool unless they are translated or the video is
// too large for it.
export function captionTool(params: Extract<ServiceParams, { kind: 'editVideo' }>, mediaBytes = 0): 'captions' | 'captionsPro' {
  return params.captionLanguage || mediaBytes > QUICK_CAPTIONS_MAX_BYTES ? 'captionsPro' : 'captions';
}

// The tools a request needs at a level, with quantities, derived from its
// parameters. `mediaSeconds` is the length of the customer's video, if any,
// and `mediaBytes` its file size.
export function planLines(params: ServiceParams, mediaSeconds = 0, tier: ServiceTier = 'mid', mediaBytes = 0): PlanLine[] {
  const lines: PlanLine[] = [{ tool: 'claude', qty: 1, task: task('فهم طلبك وتجهيز الخطة', 'Understanding your request') }];
  switch (params.kind) {
    case 'copy':
      lines.push({
        tool: tierTools.writer[tier],
        qty: params.format === 'plan' ? 3 : 1,
        task: params.format === 'plan' ? task('كتابة خطة محتوى الشهر', 'Writing the monthly plan') : task('كتابة النص', 'Writing the copy'),
      });
      break;
    case 'voice':
      lines.push({ tool: tierTools.voice[tier], qty: Math.max(1, Math.ceil(params.text.length / 1000)), task: task('تحويل النص إلى صوت', 'Turning text into voice') });
      break;
    case 'adImage':
      lines.push({ tool: tierTools.image[tier], qty: tier === 'high' ? 2 : 1, task: tier === 'high' ? task('تصميم نسختين من الإعلان', 'Designing two ad versions') : task('تصميم الإعلان', 'Designing the ad') });
      break;
    case 'editVideo': {
      const start = params.trimStart ?? 0;
      const end = params.trimEnd ?? mediaSeconds;
      const length = Math.max(1, Math.round((end || mediaSeconds || 30) - start));
      const minutes = Math.max(1, Math.ceil(length / 60));
      if (params.trimStart !== null || params.trimEnd !== null) lines.push({ tool: 'trim', qty: 1, task: task('قص الفيديو', 'Trimming the video') });
      if (params.captions) {
        const tool = captionTool(params, mediaBytes);
        const to = params.captionLanguage ? captionLanguages[params.captionLanguage].name : null;
        // Subtitles are billed per started minute of video.
        lines.push({
          tool,
          qty: minutes,
          task: to ? task(`كتابة كلامك مترجمًا إلى ${to.ar}`, `Captions translated into ${to.en}`) : task('كتابة كلامك على الفيديو', 'Adding captions'),
        });
        // VEED adds twice its base rate per minute for a translation.
        if (to) lines.push({ tool, qty: minutes * 2, task: task('رسوم الترجمة', 'Translation surcharge') });
      }
      if (params.music && params.musicMode === 'under') {
        // One step composes music to the video and mixes it under the voice.
        lines.push({ tool: 'musicUnder', qty: length, task: task('موسيقى هادئة تحت صوتك الأصلي', 'Quiet music under your own voice') });
      } else if (params.music) {
        const pro = tierTools.music[tier] === 'musicPro';
        lines.push({
          tool: tierTools.music[tier],
          qty: pro ? minutes : Math.max(1, Math.ceil(length / 30)),
          task: task('تأليف موسيقى بدل الصوت الأصلي', 'Composing music to replace the sound'),
        });
        lines.push({ tool: 'mergeAudio', qty: length, task: task('دمج الموسيقى مع الفيديو', 'Merging the music') });
      }
      if (tier === 'high') lines.push({ tool: 'upscale', qty: length, task: task('رفع الدقة وتحسين الوضوح', 'Upscaling the video') });
      break;
    }
    case 'imageVideo': {
      const seconds = photoVideoSeconds(params.duration, tier);
      lines.push({
        tool: tierTools.photoVideo[tier],
        qty: seconds,
        task: task(`تحويل صورك إلى ${count(seconds, 'second', 'ar')} من الفيديو`, `Turning your photos into ${count(seconds, 'second', 'en')} of video`),
      });
      // The high level makes its own soundtrack; the others get a Lyria
      // track, which keeps each level cheaper than the one above.
      if (params.music && tier !== 'high') {
        lines.push({ tool: 'music', qty: 1, task: task('تأليف موسيقى للفيديو', 'Composing music') });
        lines.push({ tool: 'mergeAudio', qty: seconds, task: task('دمج الموسيقى مع الفيديو', 'Merging the music') });
      }
      break;
    }
    case 'textVideo': {
      const seconds = videoSeconds(params.duration, tier);
      lines.push({ tool: tierTools.video[tier], qty: seconds, task: task(`توليد ${count(seconds, 'second', 'ar')} من المشاهد`, `Generating ${count(seconds, 'second', 'en')} of scenes`) });
      if (params.music && tier !== 'high') {
        lines.push({ tool: tierTools.music[tier], qty: 1, task: task('تأليف موسيقى للفيديو', 'Composing music') });
        lines.push({ tool: 'mergeAudio', qty: seconds, task: task('دمج الموسيقى مع الفيديو', 'Merging the music') });
      }
      break;
    }
  }
  return lines;
}

// The models behind each service, low to high, as listed on the services
// screen.
export const serviceModels: Record<ServiceKind, string> = {
  editVideo: 'Sonilo · ElevenLabs Music · Topaz',
  adImage: 'Nano Banana · Nano Banana Pro',
  textVideo: 'Wan 2.2 · Kling 3 Pro · Veo 3.1',
  imageVideo: 'Kling O1 · Wan 2.7 · Kling O3 Pro',
  copy: 'Claude Haiku · Sonnet · Opus',
  voice: 'ElevenLabs Turbo · v4 · v3',
};

// The headline model of a level, shown as a chip on the level picker.
export function tierModel(kind: ServiceKind, tier: ServiceTier): string {
  switch (kind) {
    case 'textVideo':
      return serviceTools[tierTools.video[tier]].name;
    case 'imageVideo':
      return serviceTools[tierTools.photoVideo[tier]].name;
    case 'adImage':
      return serviceTools[tierTools.image[tier]].name;
    case 'voice':
      return serviceTools[tierTools.voice[tier]].name;
    case 'copy':
      return serviceTools[tierTools.writer[tier]].name;
    case 'editVideo':
      return tier === 'high' ? 'Topaz' : serviceTools[tierTools.music[tier]].name;
  }
}

// A video edit's levels only differ where the request uses them: the music
// model when music replaces the sound, and upscaling at the high level.
function editReplacesSound(params: ServiceParams): boolean {
  return params.kind === 'editVideo' && Boolean(params.music) && params.musicMode === 'replace';
}

// The headline model of a level for one request.
export function levelModel(params: ServiceParams, tier: ServiceTier): string {
  if (params.kind !== 'editVideo') return tierModel(params.kind, tier);
  if (tier === 'high') return 'Topaz';
  if (editReplacesSound(params)) return serviceTools[tierTools.music[tier]].name;
  if (params.music) return 'Sonilo';
  if (params.captions) return params.captionLanguage ? 'VEED' : 'Auto Subtitle';
  return 'Trim';
}

// What a level gives for one request, in the customer's words.
export function levelQuality(params: ServiceParams, tier: ServiceTier): Bilingual {
  if (params.kind !== 'editVideo' || editReplacesSound(params)) {
    if (params.kind === 'editVideo') {
      return {
        low: { ar: 'موسيقى أساسية بدل الصوت الأصلي', en: 'Basic music in place of the sound' },
        mid: { ar: 'موسيقى استوديو بدل الصوت الأصلي', en: 'Studio music in place of the sound' },
        high: { ar: 'موسيقى استوديو مع رفع الدقة', en: 'Studio music plus upscaling' },
      }[tier];
    }
    return tierQuality[params.kind][tier];
  }
  if (tier === 'mid') return { ar: 'مثل المستوى المنخفض لهذا الطلب', en: 'Same as Low for this request' };
  return tierQuality.editVideo[tier];
}

// The lowest price any order can have: the low level's minimum.
export function startingPrice(settings: PricingSettings = defaultPricing): number {
  return roundUp(settings.minPrice * tierMinFactor.low, 250);
}
