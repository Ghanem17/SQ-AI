import { accessRequired, hasAccess } from '@/server/access';
import { falVoiceModel, providerName, textModel } from '@/server/ai';

export function GET(request: Request): Response {
  const provider = providerName();
  return Response.json({
    ai: provider !== null,
    access: hasAccess(request),
    accessRequired: accessRequired(),
    provider,
    textModel,
    voiceModel: provider === 'fal' ? falVoiceModel : 'elevenlabs/eleven-v4-turbo',
  });
}
