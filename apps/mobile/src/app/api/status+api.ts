import { hasKey, textModel, voiceModel } from '@/server/openrouter';

export function GET(): Response {
  return Response.json({ ai: hasKey(), textModel, voiceModel });
}
