// Shared Arabic copy for the onboarding, sign-in and tab screens. Modern
// Standard Arabic throughout; screens keep their own copy next to their code.

export const ar = {
  common: {
    next: 'التالي',
    start: 'ابدأ',
    skip: 'تخطٍّ',
    back: 'رجوع',
    close: 'إغلاق',
    or: 'أو',
  },
  onboarding: {
    slides: [
      { title: 'صوّر بهاتفك', body: 'يرشدك التطبيق إلى ما تصوّره وكيف، وينبهك فورًا إذا احتاجت اللقطة إلى إعادة.' },
      { title: 'ننشر نيابةً عنك', body: 'نصمم الريل ونكتب الوصف، وننشره على جميع منصاتك في أفضل وقت.' },
      { title: 'نرد على عملائك', body: 'يرد المساعد على الرسائل، ويسجّل الطلبات، ويحيل إليك الحالات الحساسة.' },
      { title: 'اعرف تكلفة كل طلب', body: 'نربط الإعلان بالمحادثة وبالطلب، فتعرف أين يذهب كل دينار.' },
    ],
    illustrations: {
      plate: 'المنتج داخل الإطار',
      newOrder: 'طلب جديد',
      customerAsk: 'كم سعر الكباب؟',
      assistantAnswer: 'الكباب باللحم بعشرة آلاف دينار للشخص. هل تود الطلب؟',
      customerOrder: 'أريد طبقين من الكباب إلى الكرادة',
      costLabel: 'تكلفة الطلب',
    },
  },
  auth: {
    welcome: 'أهلًا بك',
    subtitle: 'سجّل برقم هاتفك، وسنرسل إليك رمز تحقق عبر واتساب.',
    tabs: { signUp: 'حساب جديد', signIn: 'تسجيل الدخول' },
    nameLabel: 'اسم النشاط أو اسمك',
    namePlaceholder: 'مثال: اسم متجرك أو صفحتك',
    phoneLabel: 'رقم الهاتف',
    phoneHint: 'سنرسل إليك رمز تحقق عبر واتساب.',
    countryLabel: 'رمز الدولة',
    chooseCountry: 'اختر الدولة',
    sendCode: 'أرسل الرمز',
    sending: 'جارٍ الإرسال…',
    google: 'المتابعة باستخدام Google',
    apple: 'المتابعة باستخدام Apple',
    socialLater: 'يُفعَّل الدخول بحسابات Google وApple عند ربط الخادم في المرحلة الثانية.',
    terms: 'بالمتابعة، فإنك توافق على الشروط وسياسة الخصوصية.',
    swipeHint: 'اسحب للتبديل بين إنشاء حساب وتسجيل الدخول',
    phoneErrors: {
      empty: 'اكتب رقم هاتفك.',
      short: 'الرقم ناقص. تأكد من عدد الأرقام.',
      long: 'الرقم أطول من المعتاد. تأكد منه.',
      prefix: 'لا يبدو هذا رقم هاتف محمول في هذه الدولة.',
    },
    nameError: 'اكتب اسم النشاط أو اسمك.',
  },
  verify: {
    title: 'أدخل رمز التحقق',
    // The number is isolated left-to-right so its digits keep their order in Arabic text.
    sentTo: (phone: string) => `أرسلنا رمزًا من 6 أرقام عبر واتساب إلى ⁦${phone}⁩`,
    wrong: 'الرمز غير صحيح. حاول مرة أخرى.',
    expired: 'انتهت صلاحية الرمز. اطلب رمزًا جديدًا.',
    resendIn: (seconds: number) => `إعادة الإرسال بعد ${seconds} ث`,
    resend: 'أرسل الرمز مجددًا',
    changeNumber: 'تغيير الرقم',
    devHint: (code: string) => `نسخة تجريبية: الرمز هو ${code}`,
    verified: 'تم التحقق',
    codeLabel: 'رمز التحقق',
  },
  accountType: {
    title: 'كيف ستستخدم التطبيق؟',
    subtitle: 'يمكنك تغييره لاحقًا من الإعدادات.',
    shop: { title: 'لدي متجر أو مطعم', body: 'أريد مزيدًا من الطلبات والعملاء' },
    creator: { title: 'أنا صانع محتوى', body: 'أريد مزيدًا من المتابعين والتعاونات' },
    continue: 'متابعة',
  },
  tabs: {
    shop: { today: 'اليوم', inbox: 'الرسائل', camera: 'صوّر', ads: 'الإعلانات', report: 'التقرير' },
    creator: { today: 'الرئيسية', inbox: 'التعاونات', camera: 'صوّر', ads: 'الأفكار', report: 'النمو' },
  },
};

type Widen<T> = T extends string ? string : T extends (...a: infer A) => string ? (...a: A) => string : T extends readonly (infer U)[] ? Widen<U>[] : { [K in keyof T]: Widen<T[K]> };
export type Strings = Widen<typeof ar>;
