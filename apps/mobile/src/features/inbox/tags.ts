import type { ConversationTag } from '@sq/shared';
import type { Tone } from '@/components/ui';

export const tagTone: Record<ConversationTag, Tone> = {
  needsStaff: 'bad',
  newOrder: 'ok',
  assistantReplied: 'neutral',
  booking: 'pri',
  fromAd: 'acc',
};
