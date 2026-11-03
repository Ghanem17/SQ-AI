import { cleanParams } from '@sq/shared';
import { denied, hasAccess } from '@/server/access';
import { chat, errorResponse } from '@/server/ai';
import { readBusiness } from '@/server/input';
import { writerSystem } from '@/server/prompts';

const formats = { post: 'بوست لإنستغرام وفيسبوك', ad: 'نص إعلان ممول قصير مع دعوة واضحة للطلب', plan: 'خطة محتوى لشهر كامل' } as const;

export async function POST(request: Request): Promise<Response> {
  if (!hasAccess(request)) return denied();
  try {
    const body = (await request.json()) as { business?: unknown; params?: unknown };
    const p = cleanParams(body.params);
    if (!p || p.kind !== 'copy') return Response.json({ error: 'Bad request' }, { status: 400 });
    const text = await chat(
      [
        { role: 'system', content: writerSystem(readBusiness(body.business)) },
        { role: 'user', content: `المطلوب: ${formats[p.format]}\nالموضوع: ${p.topic}\nتفاصيل: ${p.details || 'لا يوجد'}` },
      ],
      { maxTokens: p.format === 'plan' ? 2500 : 900, temperature: 0.8 },
    );
    return Response.json({ text: text.trim() });
  } catch (e) {
    return errorResponse(e);
  }
}
