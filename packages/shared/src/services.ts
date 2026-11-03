// One-off services: a customer describes what they want, the assistant plans
// which AI tools it needs and how much of each, and the app prices the plan
// from the tools' real per-unit costs plus the owner's margin. The customer
// sees every tool and its cost before agreeing.

export type ServiceKind = 'copy' | 'voice' | 'adImage' | 'editVideo' | 'textVideo';

export type ServiceToolKey = 'claude' | 'image' | 'klingVideo' | 'veoVideo' | 'captions' | 'music' | 'voice' | 'trim' | 'mergeAudio';

export type ServiceTool = {
  key: ServiceToolKey;
  name: string;
  vendor: string;
  // The fal endpoint that runs it; prices are looked up by this id.
  endpoint: string;
  // What one unit is, in the customer's words.
  unit: string;
  // fal's list price per unit in US dollars, used until live prices load.
  usd: number;
  does: string;
};

export const serviceTools: Record<ServiceToolKey, ServiceTool> = {
  claude: { key: 'claude', name: 'Claude', vendor: 'Anthropic', endpoint: 'openrouter/router/openai/v1/chat/completions', unit: 'طلب', usd: 0.01, does: 'فهم الطلب وكتابة النصوص والخطة' },
  image: { key: 'image', name: 'Nano Banana Pro', vendor: 'Google', endpoint: 'fal-ai/nano-banana-pro/edit', unit: 'صورة', usd: 0.15, does: 'تصميم الإعلان من صورتك' },
  klingVideo: { key: 'klingVideo', name: 'Kling 3', vendor: 'Kuaishou', endpoint: 'fal-ai/kling-video/v3/standard/text-to-video', unit: 'ثانية', usd: 0.14, does: 'توليد مشاهد فيديو من وصف' },
  veoVideo: { key: 'veoVideo', name: 'Veo 3.1 Fast', vendor: 'Google', endpoint: 'fal-ai/veo3.1/fast', unit: 'ثانية', usd: 0.15, does: 'توليد فيديو عالي الواقعية' },
  captions: { key: 'captions', name: 'Auto Caption', vendor: 'fal', endpoint: 'fal-ai/auto-caption', unit: 'فيديو', usd: 0.1, does: 'ترجمة مكتوبة على الفيديو' },
  music: { key: 'music', name: 'Lyria 2', vendor: 'Google', endpoint: 'fal-ai/lyria2', unit: 'مقطع 30 ث', usd: 0.1, does: 'موسيقى مؤلفة للفيديو' },
  voice: { key: 'voice', name: 'ElevenLabs v4', vendor: 'ElevenLabs', endpoint: 'fal-ai/elevenlabs/tts/eleven-v4', unit: '1000 حرف', usd: 0.08, does: 'تعليق صوتي عربي' },
  trim: { key: 'trim', name: 'قص الفيديو', vendor: 'fal', endpoint: 'fal-ai/workflow-utilities/trim-video', unit: 'عملية', usd: 0.01, does: 'قص البداية والنهاية' },
  mergeAudio: { key: 'mergeAudio', name: 'دمج الصوت', vendor: 'fal', endpoint: 'fal-ai/ffmpeg-api/merge-audio-video', unit: 'ثانية', usd: 0.0002, does: 'دمج الموسيقى أو الصوت مع الفيديو' },
};

export const serviceToolKeys = Object.keys(serviceTools) as ServiceToolKey[];

export type ServiceInfo = { kind: ServiceKind; name: string; pitch: string; needs: 'video' | 'image' | null };

export const services: Record<ServiceKind, ServiceInfo> = {
  editVideo: { kind: 'editVideo', name: 'مونتاج فيديوك', pitch: 'ارفع فيديو واكتب طلباتك: قص، ترجمة، موسيقى', needs: 'video' },
  adImage: { kind: 'adImage', name: 'إعلان من صورة', pitch: 'صورة منتجك من الموبايل تصير تصميم إعلان', needs: 'image' },
  textVideo: { kind: 'textVideo', name: 'فيديو من نص', pitch: 'اوصف الفيديو ونولّده بمشاهد وموسيقى', needs: null },
  copy: { kind: 'copy', name: 'كتابة محتوى', pitch: 'بوست، نص إعلان، أو خطة محتوى شهر بلهجتك', needs: null },
  voice: { kind: 'voice', name: 'تعليق صوتي', pitch: 'نص يصير صوت عربي طبيعي، فصحى أو لهجة', needs: null },
};

export const serviceOrder: ServiceKind[] = ['editVideo', 'adImage', 'textVideo', 'copy', 'voice'];

export type PlanLine = { tool: ServiceToolKey; qty: number; task: string };

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

// Prices a plan. `prices` overrides the per-unit dollar cost of any tool
// (live prices from fal, or the owner's own numbers).
export function quote(lines: PlanLine[], settings: PricingSettings = defaultPricing, prices: Partial<Record<ServiceToolKey, number>> = {}): Quote {
  const priced: QuoteLine[] = lines
    .filter((l) => serviceTools[l.tool] && l.qty > 0)
    .map((l) => {
      const unitUsd = prices[l.tool] ?? serviceTools[l.tool].usd;
      const costUsd = unitUsd * l.qty;
      return { ...l, unitUsd, costUsd, costIqd: Math.round(costUsd * settings.usdToIqd) };
    });
  const toolsUsd = priced.reduce((s, l) => s + l.costUsd, 0);
  const toolsIqd = Math.round(toolsUsd * settings.usdToIqd);
  const totalIqd = Math.max(settings.minPrice, roundUp(toolsIqd * (1 + settings.markup), 250));
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

// The tools a request needs, with quantities, derived from its parameters.
// `mediaSeconds` is the length of the customer's uploaded video, if any.
export function planLines(params: ServiceParams, mediaSeconds = 0): PlanLine[] {
  const lines: PlanLine[] = [{ tool: 'claude', qty: 1, task: 'فهم طلبك وتجهيز الخطة' }];
  switch (params.kind) {
    case 'copy':
      lines.push({ tool: 'claude', qty: params.format === 'plan' ? 3 : 1, task: params.format === 'plan' ? 'كتابة خطة محتوى الشهر' : 'كتابة النص' });
      break;
    case 'voice':
      lines.push({ tool: 'voice', qty: Math.max(1, Math.ceil(params.text.length / 1000)), task: 'تحويل النص لصوت' });
      break;
    case 'adImage':
      lines.push({ tool: 'image', qty: 1, task: 'تصميم الإعلان من صورتك' });
      break;
    case 'editVideo': {
      const start = params.trimStart ?? 0;
      const end = params.trimEnd ?? mediaSeconds;
      const length = Math.max(1, Math.round((end || mediaSeconds || 30) - start));
      if (params.trimStart !== null || params.trimEnd !== null) lines.push({ tool: 'trim', qty: 1, task: 'قص الفيديو' });
      if (params.captions) lines.push({ tool: 'captions', qty: 1, task: 'ترجمة مكتوبة لكلامك على الفيديو' });
      if (params.music) {
        lines.push({ tool: 'music', qty: Math.max(1, Math.ceil(length / 30)), task: 'تأليف موسيقى للفيديو' });
        lines.push({ tool: 'mergeAudio', qty: length, task: 'دمج الموسيقى مع الفيديو' });
      }
      break;
    }
    case 'textVideo':
      lines.push({ tool: 'klingVideo', qty: params.duration, task: `توليد ${params.duration} ثوانٍ من المشاهد` });
      if (params.music) {
        lines.push({ tool: 'music', qty: 1, task: 'تأليف موسيقى للفيديو' });
        lines.push({ tool: 'mergeAudio', qty: params.duration, task: 'دمج الموسيقى مع الفيديو' });
      }
      break;
  }
  return lines;
}
