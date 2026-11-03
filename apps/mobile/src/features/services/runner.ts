// Runs an approved order step by step: upload, then each fal job in turn,
// each one's output feeding the next. The level the customer chose decides
// which model runs each step. Progress is reported as it goes.

import { tierTools, videoSeconds, type ServiceParams, type ServiceTier, type ServiceToolKey } from '@sq/shared';
import type { I18n } from '@/i18n';
import { AiUnavailable, postJson, unavailableText } from '@/lib/ai';
import type { Business } from './types';
import { uploadMedia, type PickedMedia } from './media';
import type { JobResult } from './store';

export type StepKey = 'upload' | 'write' | 'voice' | 'design' | 'scenes' | 'music' | 'merge' | 'trim' | 'captions' | 'upscale';

export const stepNames: Record<StepKey, { ar: string; en: string }> = {
  upload: { ar: 'رفع الملف', en: 'Uploading the file' },
  write: { ar: 'كتابة النص', en: 'Writing the copy' },
  voice: { ar: 'تسجيل الصوت', en: 'Recording the voice' },
  design: { ar: 'تصميم الإعلان', en: 'Designing the ad' },
  scenes: { ar: 'توليد المشاهد', en: 'Generating the scenes' },
  music: { ar: 'تأليف الموسيقى', en: 'Composing the music' },
  merge: { ar: 'دمج الموسيقى', en: 'Merging the music' },
  trim: { ar: 'قص الفيديو', en: 'Trimming the video' },
  captions: { ar: 'إضافة النص المكتوب', en: 'Adding captions' },
  upscale: { ar: 'رفع الدقة', en: 'Upscaling' },
};

type Report = (step: StepKey, progress: number) => void;

const POLL_MS = 3000;
const TIMEOUT_MS = 15 * 60 * 1000;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function runTool(tool: ServiceToolKey, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const job = await postJson<{ statusUrl: string; responseUrl: string }>('/api/job', { action: 'submit', tool, input });
  const started = Date.now();
  for (;;) {
    await wait(POLL_MS);
    const s = await postJson<{ status: string; result?: Record<string, unknown>; error?: string }>('/api/job', {
      action: 'poll',
      statusUrl: job.statusUrl,
      responseUrl: job.responseUrl,
    });
    if (s.status === 'done' && s.result) return s.result;
    if (s.status === 'failed') throw new Error(s.error ?? 'failed');
    if (Date.now() - started > TIMEOUT_MS) throw new Error('timeout');
  }
}

const fileUrl = (o: unknown): string => {
  const f = o as { url?: unknown } | undefined;
  if (!f || typeof f.url !== 'string') throw new Error('No file in result');
  return f.url;
};

// The steps shown to the customer while the order runs.
export function stepsFor(params: ServiceParams, hasMedia: boolean, tier: ServiceTier): StepKey[] {
  const steps: StepKey[] = hasMedia ? ['upload'] : [];
  switch (params.kind) {
    case 'copy':
      steps.push('write');
      break;
    case 'voice':
      steps.push('voice');
      break;
    case 'adImage':
      steps.push('design');
      break;
    case 'textVideo':
      steps.push('scenes');
      // Veo makes its own soundtrack.
      if (params.music && tier !== 'high') steps.push('music', 'merge');
      break;
    case 'editVideo':
      if (params.trimStart !== null || params.trimEnd !== null) steps.push('trim');
      if (params.captions) steps.push('captions');
      if (params.music) steps.push('music', 'merge');
      if (tier === 'high') steps.push('upscale');
      break;
  }
  return steps;
}

// Music at the level's quality, sized to the video where the model allows.
async function compose(tier: ServiceTier, prompt: string, seconds: number): Promise<string> {
  const tool = tierTools.music[tier];
  const r =
    tool === 'musicPro'
      ? await runTool(tool, { prompt, music_length_ms: Math.min(300000, Math.max(10000, Math.round(seconds * 1000))) })
      : await runTool(tool, { prompt });
  return fileUrl(r.audio);
}

function videoInput(tier: ServiceTier, prompt: string, seconds: number, sound: boolean): Record<string, unknown> {
  if (tier === 'low') return { prompt, aspect_ratio: '9:16', resolution: '720p', num_frames: 81, frames_per_second: 16 };
  if (tier === 'high') return { prompt, aspect_ratio: '9:16', resolution: '1080p', duration: `${seconds}s`, generate_audio: true };
  return { prompt, aspect_ratio: '9:16', duration: String(seconds), generate_audio: sound };
}

export async function runOrder(
  params: ServiceParams,
  media: PickedMedia | null,
  business: Business,
  tier: ServiceTier,
  lang: 'ar' | 'en',
  report: Report,
): Promise<JobResult> {
  const steps = stepsFor(params, Boolean(media), tier);
  let done = 0;
  const step = (key: StepKey) => report(key, done / steps.length);
  const next = () => {
    done += 1;
  };

  let sourceUrl = '';
  if (media) {
    step('upload');
    sourceUrl = await uploadMedia(media);
    next();
  }

  switch (params.kind) {
    case 'copy': {
      step('write');
      const { text } = await postJson<{ text: string }>('/api/write', { business, params, tier, lang }, 180000);
      return { type: 'text', text };
    }
    case 'voice': {
      step('voice');
      const r = await runTool(tierTools.voice[tier], { text: params.text, voice: params.voice === 'sarah' ? 'Sarah' : 'Brian' });
      return { type: 'audio', url: fileUrl(r.audio) };
    }
    case 'adImage': {
      step('design');
      const input: Record<string, unknown> = { prompt: params.prompt, image_urls: [sourceUrl], aspect_ratio: params.aspect, output_format: 'png' };
      if (tier !== 'low') input.resolution = tier === 'high' ? '2K' : '1K';
      if (tier === 'high') input.num_images = 2;
      const r = await runTool(tierTools.image[tier], input);
      const urls = ((r.images as unknown[] | undefined) ?? []).map(fileUrl);
      if (!urls.length) throw new Error('No file in result');
      return { type: 'image', url: urls[0], urls };
    }
    case 'textVideo': {
      const seconds = videoSeconds(params.duration, tier);
      const withMusic = Boolean(params.music) && tier !== 'high';
      step('scenes');
      const r = await runTool(tierTools.video[tier], videoInput(tier, params.prompt, seconds, !withMusic));
      let video = fileUrl(r.video);
      next();
      if (withMusic && params.music) {
        step('music');
        const audio = await compose(tier, params.music, seconds);
        next();
        step('merge');
        const merged = await runTool('mergeAudio', { video_url: video, audio_url: audio });
        video = fileUrl(merged.video);
      }
      return { type: 'video', url: video };
    }
    case 'editVideo': {
      let video = sourceUrl;
      const start = params.trimStart ?? 0;
      const length = Math.max(1, (params.trimEnd ?? media?.seconds ?? 30) - start);
      if (params.trimStart !== null || params.trimEnd !== null) {
        step('trim');
        const input: Record<string, unknown> = { video_url: video, start_time: start };
        if (params.trimEnd !== null) input.end_time = params.trimEnd;
        else if (media?.seconds) input.duration = Math.max(1, media.seconds - start);
        const r = await runTool('trim', input);
        video = fileUrl(r.video);
        next();
      }
      if (params.captions) {
        step('captions');
        const r = await runTool('captions', { video_url: video, font_size: 30, txt_color: 'white', stroke_width: 2 });
        if (typeof r.video_url !== 'string') throw new Error('No video in result');
        video = r.video_url;
        next();
      }
      if (params.music) {
        step('music');
        const audio = await compose(tier, params.music, length);
        next();
        step('merge');
        const merged = await runTool('mergeAudio', { video_url: video, audio_url: audio });
        video = fileUrl(merged.video);
        next();
      }
      if (tier === 'high') {
        step('upscale');
        const r = await runTool('upscale', { video_url: video, upscale_factor: 2, model: 'Proteus' });
        video = fileUrl(r.video);
      }
      return { type: 'video', url: video };
    }
  }
}

export function explain(err: unknown, { L, lang }: I18n): string {
  if (err instanceof AiUnavailable) return err.reason === 'failed' ? L(`تعذر التنفيذ: ${err.message}`, `Could not finish: ${err.message}`) : unavailableText[err.reason][lang];
  if (err instanceof Error && err.message === 'timeout') return L('استغرق التنفيذ وقتًا أطول من المتوقع. أعد المحاولة بعد قليل.', 'This took longer than expected. Try again shortly.');
  if (err instanceof Error && err.message.startsWith('upload')) return L('تعذر رفع الملف. تأكد من اتصالك بالإنترنت وأعد المحاولة.', 'Could not upload the file. Check your connection and try again.');
  return L('تعذر إكمال الطلب. أعد المحاولة.', 'Could not complete the order. Try again.');
}
