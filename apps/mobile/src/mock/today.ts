import type { TodaySummary } from '@sq/shared';

// Sample data for phase 1, shown with a "بيانات تجريبية" label. It is replaced
// by the server API in phase 2; screens only depend on the TodaySummary type.
export const sampleToday: TodaySummary = {
  greetingName: 'مطعم بيت الريف',
  task: {
    title: 'صوّر صحن الدولمة',
    hint: 'ثلاث لقطات من الأعلى قرب النافذة',
    shotsDone: 1,
    shotsTotal: 3,
  },
  costPerOrder: 2100,
  costChangePercent: 24,
  replyRate: 96,
  ordersToday: 14,
  pendingReel: { title: 'ريل الكباب جاهز', seconds: 15, platforms: ['instagram', 'facebook'] },
  needsStaffCount: 2,
};

export const sampleCreator = {
  name: 'نور',
  niche: 'أكل وسفر، 48.2 ألف متابع',
  idea: {
    title: 'جرّب 3 مطاعم بـ 20 ألف دينار',
    hook: 'أول ثانيتين: «بـ 20 ألف، وين أطيب عشا ببغداد؟»',
  },
  newFollowers: 1240,
  engagement: 6.8,
  views: '182 ألف',
  offer: { brand: 'مطعم بيت الريف', scope: 'ريل وستوري، قبل 15 تشرين الثاني', price: 150000 },
};
