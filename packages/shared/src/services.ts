// One-off services: a customer describes what they want, picks a level
// (low, medium, high), and the app prices the exact AI models that level
// uses from their real per-unit costs plus the owner's margin. The customer
// sees every model and its cost before agreeing.

export type Lang = 'ar' | 'en';
export type Bilingual = { ar: string; en: string };

export type ServiceKind = 'copy' | 'voice' | 'adImage' | 'editVideo' | 'textVideo';
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
  | 'voiceTurbo'
  | 'voice'
  | 'voiceV3'
  | 'music'
  | 'musicPro'
  | 'captions'
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
  veoVideo: t('veoVideo', 'Veo 3.1', 'Google', 'fal-ai/veo3.1', 0.4, U.second, { ar: 'فيديو سينمائي بصوت أصلي بدقة 1080p', en: 'Cinematic 1080p video with native sound' }),
  voiceTurbo: t('voiceTurbo', 'ElevenLabs Turbo 2.5', 'ElevenLabs', 'fal-ai/elevenlabs/tts/turbo-v2.5', 0.05, U.chars, { ar: 'صوت واضح وسريع', en: 'Clear, fast voice' }),
  voice: t('voice', 'ElevenLabs v4', 'ElevenLabs', 'fal-ai/elevenlabs/tts/eleven-v4', 0.08, U.chars, { ar: 'صوت طبيعي بنبرة متوازنة', en: 'Natural, balanced voice' }),
  voiceV3: t('voiceV3', 'ElevenLabs v3', 'ElevenLabs', 'fal-ai/elevenlabs/tts/eleven-v3', 0.1, U.chars, { ar: 'أكثر الأصوات تعبيرًا وإحساسًا', en: 'The most expressive voice' }),
  music: t('music', 'Lyria 2', 'Google', 'fal-ai/lyria2', 0.1, U.clip, { ar: 'موسيقى مؤلفة للفيديو', en: 'Composed music for the video' }),
  musicPro: t('musicPro', 'ElevenLabs Music', 'ElevenLabs', 'fal-ai/elevenlabs/music', 0.6, U.minute, { ar: 'موسيقى بجودة استوديو على طول الفيديو', en: 'Studio-quality music to the video length' }),
  captions: t('captions', 'Auto Caption', 'fal', 'fal-ai/auto-caption', 0.1, U.video, { ar: 'نص مكتوب لكلامك على الفيديو', en: 'Your speech as on-screen captions' }),
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
    pitch: { ar: 'ارفع فيديو واكتب طلباتك: قص وترجمة وموسيقى', en: 'Upload a video and say what you want: trims, captions, music' },
    needs: 'video',
  },
  adImage: {
    kind: 'adImage',
    name: { ar: 'إعلان من صورة', en: 'Ad from a photo' },
    pitch: { ar: 'تتحول صورة منتجك إلى تصميم إعلان', en: 'Your product photo becomes an ad design' },
    needs: 'image',
  },
  textVideo: {
    kind: 'textVideo',
    name: { ar: 'فيديو من نص', en: 'Video from text' },
    pitch: { ar: 'صف الفيديو ونولّده بمشاهد وموسيقى', en: 'Describe it and we generate scenes and music' },
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

export const serviceOrder: ServiceKind[] = ['editVideo', 'adImage', 'textVideo', 'copy', 'voice'];

export const tierNames: Record<ServiceTier, Bilingual> = {
  low: { ar: 'منخفض', en: 'Low' },
  mid: { ar: 'متوسط', en: 'Medium' },
  high: { ar: 'عالٍ', en: 'High' },
};

// What changes between levels for each service, in the customer's words.
export const tierQuality: Record<ServiceKind, Record<ServiceTier, Bilingual>> = {
  textVideo: {
    low: { ar: '5 ثوانٍ بدقة 720p، مناسب للتجربة والمنشورات السريعة', en: '5 seconds at 720p, good for tests and quick posts' },
    mid: { ar: 'حتى 15 ثانية بجودة احترافية وحركة أكثر سلاسة', en: 'Up to 15 seconds, professional quality, smoother motion' },
    high: { ar: 'حتى 8 ثوانٍ بجودة سينمائية 1080p مع صوت أصلي', en: 'Up to 8 seconds, cinematic 1080p with native sound' },
  },
  adImage: {
    low: { ar: 'تصميم واحد سريع بجودة جيدة', en: 'One quick design, good quality' },
    mid: { ar: 'تصميم احترافي بتفاصيل ونص أدق', en: 'A professional design with sharper detail and text' },
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
    low: { ar: 'تنفيذ طلباتك مع موسيقى أساسية', en: 'Your edits with basic music' },
    mid: { ar: 'موسيقى بجودة استوديو على طول الفيديو', en: 'Studio-quality music to the video length' },
    high: { ar: 'موسيقى استوديو مع رفع الدقة وتحسين الوضوح', en: 'Studio music plus higher resolution and sharper detail' },
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
  | { kind: 'editVideo'; trimStart: number | null; trimEnd: number | null; captions: boolean; music: string | null }
  | { kind: 'textVideo'; prompt: string; duration: number; music: string | null };

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
      return {
        kind: 'editVideo',
        trimStart: trimStart !== null && trimStart > 0 ? trimStart : null,
        trimEnd: trimEnd !== null && trimEnd > 0 ? trimEnd : null,
        captions: p.captions === true,
        music: str(p.music, 400) || null,
      };
    }
    case 'textVideo': {
      const prompt = str(p.prompt, 1500);
      const duration = Math.round(clamp(num(p.duration) ?? 5, VIDEO_SECONDS.min, VIDEO_SECONDS.max));
      return prompt ? { kind: 'textVideo', prompt, duration, music: str(p.music, 400) || null } : null;
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

// The tools each level uses, by role.
export const tierTools = {
  writer: { low: 'claudeHaiku', mid: 'claude', high: 'claudeOpus' },
  image: { low: 'imageLite', mid: 'image', high: 'image' },
  video: { low: 'wanVideo', mid: 'klingVideo', high: 'veoVideo' },
  voice: { low: 'voiceTurbo', mid: 'voice', high: 'voiceV3' },
  music: { low: 'music', mid: 'musicPro', high: 'musicPro' },
} as const satisfies Record<string, Record<ServiceTier, ServiceToolKey>>;

const task = (ar: string, en: string): Bilingual => ({ ar, en });

// The tools a request needs at a level, with quantities, derived from its
// parameters. `mediaSeconds` is the length of the customer's video, if any.
export function planLines(params: ServiceParams, mediaSeconds = 0, tier: ServiceTier = 'mid'): PlanLine[] {
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
      if (params.trimStart !== null || params.trimEnd !== null) lines.push({ tool: 'trim', qty: 1, task: task('قص الفيديو', 'Trimming the video') });
      if (params.captions) lines.push({ tool: 'captions', qty: 1, task: task('كتابة كلامك على الفيديو', 'Adding captions') });
      if (params.music) {
        const pro = tierTools.music[tier] === 'musicPro';
        lines.push({
          tool: tierTools.music[tier],
          qty: pro ? Math.max(1, Math.ceil(length / 60)) : Math.max(1, Math.ceil(length / 30)),
          task: task('تأليف موسيقى للفيديو', 'Composing music'),
        });
        lines.push({ tool: 'mergeAudio', qty: length, task: task('دمج الموسيقى مع الفيديو', 'Merging the music') });
      }
      if (tier === 'high') lines.push({ tool: 'upscale', qty: length, task: task('رفع الدقة وتحسين الوضوح', 'Upscaling the video') });
      break;
    }
    case 'textVideo': {
      const seconds = videoSeconds(params.duration, tier);
      lines.push({ tool: tierTools.video[tier], qty: seconds, task: task(`توليد ${seconds} ثوانٍ من المشاهد`, `Generating ${seconds} seconds of scenes`) });
      if (params.music && tier !== 'high') {
        lines.push({ tool: tierTools.music[tier], qty: 1, task: task('تأليف موسيقى للفيديو', 'Composing music') });
        lines.push({ tool: 'mergeAudio', qty: seconds, task: task('دمج الموسيقى مع الفيديو', 'Merging the music') });
      }
      break;
    }
  }
  return lines;
}
