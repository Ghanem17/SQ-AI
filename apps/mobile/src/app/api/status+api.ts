import { falVoiceModel, providerName, textModel } from '@/server/ai';

export function GET(): Response {
  const provider = providerName();
  return Response.json({ ai: provider !== null, provider, textModel, voiceModel: provider === 'fal' ? falVoiceModel : 'elevenlabs/eleven-v4-turbo' });
}
