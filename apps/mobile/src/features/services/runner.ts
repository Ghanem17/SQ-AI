// Runs an approved order step by step: upload, then each fal job in turn,
// each one's output feeding the next. Progress is reported as it goes.

import type { ServiceParams, ServiceToolKey } from '@sq/shared';
import { AiUnavailable, postJson, unavailableText } from '@/lib/ai';
import type { Business } from './types';
import { uploadMedia, type PickedMedia } from './media';
import type { JobResult } from './store';

type Report = (step: string, progress: number) => void;

const POLL_MS = 3000;
const TIMEOUT_MS = 12 * 60 * 1000;

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

// The plan of steps shown to the customer while the order runs.
export function stepsFor(params: ServiceParams, hasMedia: boolean): string[] {
  const steps: string[] = [];
  if (hasMedia) steps.push('رفع الملف');
  switch (params.kind) {
    case 'copy':
      steps.push('كتابة النص');
      break;
    case 'voice':
      steps.push('تسجيل الصوت');
      break;
    case 'adImage':
      steps.push('تصميم الإعلان');
      break;
    case 'textVideo':
      steps.push('توليد المشاهد');
      if (params.music) steps.push('تأليف الموسيقى', 'دمج الموسيقى');
      break;
    case 'editVideo':
      if (params.trimStart !== null || params.trimEnd !== null) steps.push('قص الفيديو');
      if (params.captions) steps.push('إضافة الترجمة');
      if (params.music) steps.push('تأليف الموسيقى', 'دمج الموسيقى');
      break;
  }
  return steps;
}

export async function runOrder(params: ServiceParams, media: PickedMedia | null, business: Business, report: Report): Promise<JobResult> {
  const steps = stepsFor(params, Boolean(media));
  let done = 0;
  const step = (name: string) => report(name, done / steps.length);
  const next = () => {
    done += 1;
  };

  let sourceUrl = '';
  if (media) {
    step('رفع الملف');
    sourceUrl = await uploadMedia(media);
    next();
  }

  switch (params.kind) {
    case 'copy': {
      step('كتابة النص');
      const { text } = await postJson<{ text: string }>('/api/write', { business, params }, 120000);
      return { type: 'text', text };
    }
    case 'voice': {
      step('تسجيل الصوت');
      const r = await runTool('voice', { text: params.text, voice: params.voice === 'sarah' ? 'Sarah' : 'Brian', language_code: 'ar' });
      return { type: 'audio', url: fileUrl(r.audio) };
    }
    case 'adImage': {
      step('تصميم الإعلان');
      const r = await runTool('image', { prompt: params.prompt, image_urls: [sourceUrl], aspect_ratio: params.aspect, resolution: '2K', output_format: 'png' });
      const images = r.images as unknown[] | undefined;
      return { type: 'image', url: fileUrl(images?.[0]) };
    }
    case 'textVideo': {
      step('توليد المشاهد');
      const r = await runTool('klingVideo', { prompt: params.prompt, duration: String(params.duration), aspect_ratio: '9:16', generate_audio: !params.music });
      let video = fileUrl(r.video);
      next();
      if (params.music) {
        step('تأليف الموسيقى');
        const m = await runTool('music', { prompt: params.music });
        next();
        step('دمج الموسيقى');
        const merged = await runTool('mergeAudio', { video_url: video, audio_url: fileUrl(m.audio) });
        video = fileUrl(merged.video);
      }
      return { type: 'video', url: video };
    }
    case 'editVideo': {
      let video = sourceUrl;
      if (params.trimStart !== null || params.trimEnd !== null) {
        step('قص الفيديو');
        const input: Record<string, unknown> = { video_url: video, start_time: params.trimStart ?? 0 };
        if (params.trimEnd !== null) input.end_time = params.trimEnd;
        else if (media?.seconds) input.duration = Math.max(1, media.seconds - (params.trimStart ?? 0));
        const r = await runTool('trim', input);
        video = fileUrl(r.video);
        next();
      }
      if (params.captions) {
        step('إضافة الترجمة');
        const r = await runTool('captions', { video_url: video, font_size: 30, txt_color: 'white', stroke_width: 2 });
        if (typeof r.video_url !== 'string') throw new Error('No video in result');
        video = r.video_url;
        next();
      }
      if (params.music) {
        step('تأليف الموسيقى');
        const m = await runTool('music', { prompt: params.music });
        next();
        step('دمج الموسيقى');
        const merged = await runTool('mergeAudio', { video_url: video, audio_url: fileUrl(m.audio) });
        video = fileUrl(merged.video);
      }
      return { type: 'video', url: video };
    }
  }
}

export function explain(err: unknown): string {
  if (err instanceof AiUnavailable) return err.reason === 'failed' ? `تعذر التنفيذ: ${err.message}` : unavailableText[err.reason];
  if (err instanceof Error && err.message === 'timeout') return 'التنفيذ أخذ وقتًا أطول من المتوقع. أعد المحاولة بعد قليل.';
  if (err instanceof Error && err.message.startsWith('upload')) return 'تعذر رفع الملف. تأكد من الإنترنت وأعد المحاولة.';
  return 'تعذر إكمال الطلب. أعد المحاولة.';
}
