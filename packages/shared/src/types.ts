export type AccountType = 'shop' | 'creator';

export type ThemePreference = 'system' | 'light' | 'dark';

export type Platform = 'instagram' | 'facebook' | 'whatsapp' | 'messenger' | 'tiktok' | 'youtube';

export type ConversationTag = 'needsStaff' | 'newOrder' | 'assistantReplied' | 'booking' | 'fromAd';

export type ConversationPreview = {
  id: string;
  name: string;
  initial: string;
  platform: Platform;
  time: string;
  lastMessage: string;
  tag: ConversationTag;
};

export type TodayTask = {
  title: string;
  hint: string;
  shotsDone: number;
  shotsTotal: number;
};

export type TodaySummary = {
  greetingName: string;
  task: TodayTask;
  costPerOrder: number;
  costChangePercent: number;
  replyRate: number;
  ordersToday: number;
  pendingReel: { title: string; seconds: number; platforms: Platform[] } | null;
  needsStaffCount: number;
};
