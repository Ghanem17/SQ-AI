// Sample account data for the demo build. Each screen depends only on these
// shapes, so phase 2 swaps this file for API calls without touching layouts.

import type { ConversationTag, Platform } from '@sq/shared';

export type Shot = { title: string; hint: string; seconds: number; angle: string };

export const todayShots: Shot[] = [
  { title: 'الصحن كامل من الأعلى', hint: 'ضع الصحن في منتصف الإطار قرب النافذة', seconds: 4, angle: 'من الأعلى' },
  { title: 'لقطة قريبة للحشوة', hint: 'افتح ورقة عنب واحدة، الموبايل على بعد شبرين', seconds: 3, angle: 'قريبة' },
  { title: 'سكب الليمون', hint: 'حركة بطيئة وثابتة، بدون تقريب', seconds: 4, angle: 'جانبية' },
];

export type Message = { id: string; from: 'customer' | 'assistant' | 'staff'; text: string; time: string };

export type Conversation = {
  id: string;
  name: string;
  platform: Platform;
  time: string;
  lastMessage: string;
  tag: ConversationTag;
  unread: number;
  order?: { items: string; total: number; area: string };
  messages: Message[];
};

export const conversations: Conversation[] = [
  {
    id: 'c1',
    name: 'أحمد الجبوري',
    platform: 'whatsapp',
    time: '10:42',
    lastMessage: 'ممكن تبدلون الطلب لثلاث نفرات بدل اثنين؟',
    tag: 'needsStaff',
    unread: 2,
    messages: [
      { id: 'm1', from: 'customer', text: 'السلام عليكم، طلبت قبل نص ساعة دولمة لنفرين', time: '10:31' },
      { id: 'm2', from: 'assistant', text: 'وعليكم السلام أستاذ أحمد، طلبك رقم 1043 قيد التحضير وسيصلك خلال 35 دقيقة.', time: '10:31' },
      { id: 'm3', from: 'customer', text: 'ممكن تبدلون الطلب لثلاث نفرات بدل اثنين؟', time: '10:42' },
      { id: 'm4', from: 'assistant', text: 'تعديل طلب قيد التحضير يحتاج موافقة المطبخ، حوّلت طلبك لأحد الموظفين وسيرد عليك خلال دقائق.', time: '10:42' },
    ],
  },
  {
    id: 'c2',
    name: 'سارة محمد',
    platform: 'instagram',
    time: '10:15',
    lastMessage: 'تم تسجيل طلبك: 2 كباب، توصيل للكرادة',
    tag: 'newOrder',
    unread: 0,
    order: { items: '2 كباب لحم، 1 لبن', total: 23000, area: 'الكرادة' },
    messages: [
      { id: 'm1', from: 'customer', text: 'شكد سعر الكباب؟', time: '10:12' },
      { id: 'm2', from: 'assistant', text: 'الكباب لحم 10,000 دينار للنفر، والتوصيل مجاني للكرادة. تحبين تطلبين؟', time: '10:12' },
      { id: 'm3', from: 'customer', text: 'اي اريد 2 كباب ولبن، للكرادة شارع 62', time: '10:14' },
      { id: 'm4', from: 'assistant', text: 'تم تسجيل طلبك: 2 كباب، 1 لبن. المجموع 23,000 دينار، التوصيل خلال 45 دقيقة.', time: '10:15' },
    ],
  },
  {
    id: 'c3',
    name: 'علي حسين',
    platform: 'facebook',
    time: '09:58',
    lastMessage: 'نعم، عندنا حجز عائلي يوم الجمعة من الساعة 1 ظهرًا.',
    tag: 'booking',
    unread: 0,
    messages: [
      { id: 'm1', from: 'customer', text: 'عدكم مكان لعائلة 8 أشخاص الجمعة الظهر؟', time: '09:57' },
      { id: 'm2', from: 'assistant', text: 'نعم، عندنا حجز عائلي يوم الجمعة من الساعة 1 ظهرًا. أثبّت لك الحجز باسم علي؟', time: '09:58' },
    ],
  },
  {
    id: 'c4',
    name: 'زينب كريم',
    platform: 'instagram',
    time: '09:20',
    lastMessage: 'شفت الريل، الدولمة متوفرة اليوم؟',
    tag: 'fromAd',
    unread: 1,
    messages: [
      { id: 'm1', from: 'customer', text: 'شفت الريل، الدولمة متوفرة اليوم؟', time: '09:20' },
      { id: 'm2', from: 'assistant', text: 'أهلًا زينب، نعم متوفرة اليوم حتى الساعة 11 مساءً. سعر الصحن 12,000 دينار.', time: '09:20' },
    ],
  },
  {
    id: 'c5',
    name: 'مصطفى ناظم',
    platform: 'messenger',
    time: 'أمس',
    lastMessage: 'شكرًا لك، يسعدنا تقييمك.',
    tag: 'assistantReplied',
    unread: 0,
    messages: [
      { id: 'm1', from: 'customer', text: 'الأكل كان طيب جدًا البارحة 👌', time: 'أمس' },
      { id: 'm2', from: 'assistant', text: 'شكرًا لك، يسعدنا تقييمك.', time: 'أمس' },
    ],
  },
];

export const tagLabels: Record<ConversationTag, string> = {
  needsStaff: 'يحتاج موظفًا',
  newOrder: 'طلب جديد',
  assistantReplied: 'رد المساعد',
  booking: 'حجز',
  fromAd: 'من إعلان',
};

export type Campaign = {
  id: string;
  title: string;
  platform: Platform;
  status: 'active' | 'paused' | 'ended';
  daily: number;
  spent: number;
  reach: number;
  orders: number;
  daysLeft: number;
};

export const campaigns: Campaign[] = [
  { id: 'a1', title: 'ريل الكباب', platform: 'instagram', status: 'active', daily: 12000, spent: 48000, reach: 9400, orders: 26, daysLeft: 3 },
  { id: 'a2', title: 'عرض الغداء العائلي', platform: 'facebook', status: 'active', daily: 5000, spent: 25000, reach: 5100, orders: 9, daysLeft: 2 },
  { id: 'a3', title: 'ريل المشويات', platform: 'tiktok', status: 'paused', daily: 8000, spent: 32000, reach: 11800, orders: 7, daysLeft: 0 },
  { id: 'a4', title: 'ريل الدولمة الأول', platform: 'instagram', status: 'ended', daily: 10000, spent: 70000, reach: 13600, orders: 31, daysLeft: 0 },
];

export const report = {
  costPerOrder: { value: 2100, prev: 2760, series: [3100, 2950, 2900, 2700, 2650, 2400, 2300, 2100], labels: ['أ1', 'أ2', 'أ3', 'أ4', 'أ5', 'أ6', 'أ7', 'أ8'] },
  orders: { value: 412, prev: 338 },
  revenue: { value: 6840000, prev: 5520000 },
  spend: { value: 865000, prev: 932000 },
  sources: [
    { label: 'إنستغرام', value: 186, note: '1,900 د.ع للطلب' },
    { label: 'واتساب مباشر', value: 121, note: 'بدون إعلان' },
    { label: 'فيسبوك', value: 72, note: '2,600 د.ع للطلب' },
    { label: 'تيك توك', value: 33, note: '3,400 د.ع للطلب' },
  ],
  topReels: [
    { title: 'ريل الدولمة الأول', orders: 31, cost: 2260, views: '48 ألف' },
    { title: 'ريل الكباب', orders: 26, cost: 1850, views: '39 ألف' },
    { title: 'عرض الغداء العائلي', orders: 9, cost: 2780, views: '17 ألف' },
  ],
};

export const growth = {
  followers: { value: 48200, prev: 44100, series: [41200, 41900, 42700, 43300, 44100, 45600, 46900, 48200], labels: ['أ1', 'أ2', 'أ3', 'أ4', 'أ5', 'أ6', 'أ7', 'أ8'] },
  engagement: { value: 6.8, prev: 5.9 },
  views: { value: 182000, prev: 151000 },
  income: { value: 1150000, prev: 800000 },
  platforms: [
    { label: 'إنستغرام', value: 29800, note: '\u2066+2,400\u2069' },
    { label: 'تيك توك', value: 14100, note: '\u2066+1,500\u2069' },
    { label: 'يوتيوب', value: 4300, note: '\u2066+200\u2069' },
  ],
  topPosts: [
    { title: '3 مطاعم بـ 20 ألف', views: '61 ألف', followers: 820 },
    { title: 'أطيب فطور بالكرادة', views: '44 ألف', followers: 510 },
    { title: 'جولة شارع المتنبي', views: '29 ألف', followers: 230 },
  ],
};

export type Collab = { id: string; brand: string; scope: string; price: number; deadline: string; status: 'new' | 'accepted' | 'done' };

export const collabs: Collab[] = [
  { id: 'k1', brand: 'مطعم بيت الريف', scope: 'ريل وستوري', price: 150000, deadline: 'قبل 15 تشرين الثاني', status: 'new' },
  { id: 'k2', brand: 'كافيه الزاوية', scope: 'ريل واحد', price: 90000, deadline: 'قبل 20 تشرين الثاني', status: 'new' },
  { id: 'k3', brand: 'حلويات السلطان', scope: '3 ستوريات', price: 60000, deadline: 'تم التسليم', status: 'done' },
];

export type Idea = { id: string; title: string; hook: string; why: string; shots: number };

export const ideas: Idea[] = [
  { id: 'i1', title: 'جرّب 3 مطاعم بـ 20 ألف', hook: '«بـ 20 ألف، وين أطيب عشا ببغداد؟»', why: 'أفضل فيديو عندك هذا الشهر كان من نفس النوع', shots: 6 },
  { id: 'i2', title: 'فطور الجمعة بأقل من 10 آلاف', hook: '«فطور كامل بـ 9 آلاف، يستاهل؟»', why: 'البحث عن «فطور بغداد» ارتفع 40% هذا الأسبوع', shots: 5 },
  { id: 'i3', title: 'تحدي الأكلة الأغلى والأرخص', hook: '«الفرق بين 5 آلاف و50 ألف»', why: 'فيديوهات المقارنة تحصل على مشاركات أكثر بمرتين', shots: 8 },
];

export const bestTime = { label: 'اليوم، 8:30 مساءً', reason: 'متابعوك أنشط بين 8 و10 مساءً، والتفاعل في هذا الوقت أعلى بـ 38%.' };
