// A reel's shot list. Ideas from the assistant bring their own; the starter
// lists below work for any business when the owner just wants to film.

export type Shot = { title: string; hint: string; seconds: number; angle: string };

export const starterShots: Record<'shop' | 'creator', Shot[]> = {
  shop: [
    { title: 'المنتج كامل', hint: 'ضع المنتج في منتصف الإطار قرب ضوء طبيعي', seconds: 4, angle: 'واسعة' },
    { title: 'لقطة قريبة للتفاصيل', hint: 'اقترب ببطء على أجمل تفصيل في المنتج', seconds: 3, angle: 'قريبة' },
    { title: 'المنتج قيد الاستخدام', hint: 'يد تمسك المنتج أو زبون يستخدمه، حركة ثابتة', seconds: 4, angle: 'جانبية' },
  ],
  creator: [
    { title: 'افتتاحية بوجهك', hint: 'قل جملة الافتتاح والكاميرا بمستوى عينيك', seconds: 3, angle: 'قريبة' },
    { title: 'المكان أو الموضوع', hint: 'لقطة واسعة تعرّف المشاهد وين أنت', seconds: 4, angle: 'واسعة' },
    { title: 'رأيك والخلاصة', hint: 'جملة قصيرة تنهي الفيديو وتطلب المتابعة', seconds: 4, angle: 'قريبة' },
  ],
};

export const bestTimeHint = {
  label: 'بين 8 و10 مساءً',
  reason: 'هذا أنشط وقت عمومًا على إنستغرام وفيسبوك في العراق. بعد ربط حساباتك نحسبه من نشاط متابعيك أنت.',
};
