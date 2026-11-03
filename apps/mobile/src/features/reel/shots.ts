// A reel's shot list. Ideas from the assistant bring their own; the starter
// lists below work for any business when the owner just wants to film.

export type Shot = { title: string; hint: string; seconds: number; angle: string };

type Lang = 'ar' | 'en';

const starters: Record<Lang, Record<'shop' | 'creator', Shot[]>> = {
  ar: {
    shop: [
      { title: 'المنتج كاملًا', hint: 'ضع المنتج في منتصف الإطار قرب ضوء طبيعي', seconds: 4, angle: 'واسعة' },
      { title: 'لقطة قريبة للتفاصيل', hint: 'اقترب ببطء من أجمل تفصيل في المنتج', seconds: 3, angle: 'قريبة' },
      { title: 'المنتج قيد الاستخدام', hint: 'يد تمسك المنتج أو عميل يستخدمه، بحركة ثابتة', seconds: 4, angle: 'جانبية' },
    ],
    creator: [
      { title: 'افتتاحية بوجهك', hint: 'قل جملة الافتتاح والكاميرا بمستوى عينيك', seconds: 3, angle: 'قريبة' },
      { title: 'المكان أو الموضوع', hint: 'لقطة واسعة تعرّف المشاهد بمكانك', seconds: 4, angle: 'واسعة' },
      { title: 'رأيك والخلاصة', hint: 'جملة قصيرة تختم الفيديو وتدعو إلى المتابعة', seconds: 4, angle: 'قريبة' },
    ],
  },
  en: {
    shop: [
      { title: 'The whole product', hint: 'Center the product in the frame near natural light', seconds: 4, angle: 'Wide' },
      { title: 'Close-up on details', hint: 'Move in slowly on the best detail of the product', seconds: 3, angle: 'Close' },
      { title: 'The product in use', hint: 'A hand holding it or a customer using it, steady', seconds: 4, angle: 'Side' },
    ],
    creator: [
      { title: 'Open with your face', hint: 'Say your opening line with the camera at eye level', seconds: 3, angle: 'Close' },
      { title: 'The place or topic', hint: 'A wide shot that shows viewers where you are', seconds: 4, angle: 'Wide' },
      { title: 'Your take and wrap-up', hint: 'A short line that ends the video and asks for a follow', seconds: 4, angle: 'Close' },
    ],
  },
};

export function starterShots(kind: 'shop' | 'creator', lang: Lang): Shot[] {
  return starters[lang][kind];
}

export const bestTimeHint = {
  label: { ar: 'بين 8 و10 مساءً', en: 'between 8 and 10 pm' },
  reason: {
    ar: 'هذا أنشط وقت عمومًا على إنستغرام وفيسبوك في العراق. بعد ربط حساباتك نحسبه من نشاط متابعيك أنت.',
    en: 'This is generally the busiest time on Instagram and Facebook in Iraq. Once your accounts are linked we work it out from your own followers.',
  },
};
