import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Share, StyleSheet, TextInput, View, type ScrollViewInstance } from 'react-native';
import Animated, { Easing, FadeInUp, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

import {
  font,
  formatDate,
  formatIQD,
  formatTime,
  radius,
  serviceTools,
  services,
  tierNames,
  videoSeconds,
  type Quote,
  type ServiceKind,
  type ServiceParams,
  type ServiceTier,
  type ServiceToolKey,
} from '@sq/shared';
import { AppText } from '@/components/AppText';
import { SuccessSeal } from '@/components/brand';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { Badge, Card, Chip, Footer, GUTTER, IconBadge, IconButton, KeyValue, Note, Progress, ScrollScreen, SectionTitle, StepTrack, TopBar, ui, type StepState } from '@/components/ui';
import { useI18n, type I18n } from '@/i18n';
import { AiUnavailable, aiErrorText, postJson, useBusiness } from '@/lib/ai';
import { LevelPicker } from '@/features/services/LevelPicker';
import { ReplyBubble, RequestBubble, VersionQuote, VersionResult } from '@/features/services/Thread';
import { serviceIcons } from '@/features/services/OrderRow';
import { WhyPrice } from '@/features/services/WhyPrice';
import { failCode, failMessage, needsUpload, runOrder, stepNames, stepsFor, type StepKey } from '@/features/services/runner';
import { threadOf, useServices, type ServiceJob } from '@/features/services/store';
import { useTheme } from '@/theme/theme';

// Utility steps that are not worth naming as "the models".
const utilities = new Set<ServiceToolKey>(['mergeAudio', 'trim']);

function modelNames(job: ServiceJob): string {
  const lines = job.quote.lines.length > 1 ? job.quote.lines.slice(1) : job.quote.lines;
  const names = [...new Set(lines.filter((l) => !utilities.has(l.tool)).map((l) => serviceTools[l.tool].name))];
  return names.join(' · ');
}

function levelLabel(job: ServiceJob, i18n: I18n): string {
  const name = i18n.pick(tierNames[job.tier]);
  if (job.params.kind !== 'textVideo') return name;
  const s = videoSeconds(job.params.duration, job.tier);
  return `${name} · ${i18n.n(s, 'second')}`;
}

function receiptText(job: ServiceJob, i18n: I18n): string {
  const { L, pick, lang } = i18n;
  return [
    'SQ AI',
    L(`رقم الطلب: ${job.id}`, `Order: ${job.id}`),
    L(`التاريخ: ${formatDate(job.createdAt, lang)} · ${formatTime(job.createdAt)}`, `Date: ${formatDate(job.createdAt, lang)} · ${formatTime(job.createdAt)}`),
    L(`الخدمة: ${pick(services[job.kind].name)}`, `Service: ${pick(services[job.kind].name)}`),
    L(`المستوى: ${levelLabel(job, i18n)}`, `Level: ${levelLabel(job, i18n)}`),
    ...job.quote.lines.map((l) => `${serviceTools[l.tool].name} · ${pick(l.task)}: ${formatIQD(l.costIqd)}`),
    L(`رسوم الخدمة: ${formatIQD(job.quote.feeIqd)}`, `Service fee: ${formatIQD(job.quote.feeIqd)}`),
    L(`الإجمالي: ${formatIQD(job.quote.totalIqd)}`, `Total: ${formatIQD(job.quote.totalIqd)}`),
  ].join('\n');
}

const SEAL = 68;

// The seal of a finished order. When the order finishes while the screen is
// open it settles in with a short scale and two quiet pulses of its ring, and
// the phone confirms with a success tap. Reduced motion shows it still.
function DoneSeal({ celebrate }: { celebrate: boolean }) {
  const { c } = useTheme();
  const reduceMotion = useReducedMotion();
  const play = celebrate && !reduceMotion;
  const scale = useSharedValue(play ? 0.55 : 1);
  const fade = useSharedValue(play ? 0 : 1);
  const ring = useSharedValue(0);

  useEffect(() => {
    if (!celebrate) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    if (!play) return;
    fade.set(withTiming(1, { duration: 240 }));
    scale.set(withTiming(1, { duration: 460, easing: Easing.out(Easing.cubic) }));
    ring.set(withDelay(380, withRepeat(withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) }), 2, false)));
  }, [celebrate, play, fade, scale, ring]);

  const sealStyle = useAnimatedStyle(() => ({ opacity: fade.get(), transform: [{ scale: scale.get() }] }));
  const ringStyle = useAnimatedStyle(() => {
    const t = ring.get();
    return { opacity: t > 0 && t < 1 ? (1 - t) * 0.55 : 0, transform: [{ scale: 1 + t * 0.55 }] };
  });

  return (
    <View style={styles.sealBox}>
      <Animated.View style={[styles.ring, { borderColor: c.accent }, ringStyle]} />
      <Animated.View style={sealStyle}>
        <SuccessSeal size={SEAL} />
      </Animated.View>
    </View>
  );
}

// Fades the result up into place after the seal settles.
function Reveal({ animate, delay, children }: { animate: boolean; delay: number; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return <Animated.View entering={animate && !reduceMotion ? FadeInUp.delay(delay).duration(420) : undefined}>{children}</Animated.View>;
}

// Short ideas for a change, per service, that fill the composer.
const changeIdeas: Record<ServiceKind, { ar: string; en: string }[]> = {
  adImage: [
    { ar: 'اجعل الخلفية أفتح', en: 'Make the background lighter' },
    { ar: 'كبّر اسم المنتج', en: 'Make the product name bigger' },
  ],
  copy: [
    { ar: 'اجعل المنشور أقصر', en: 'Make the post shorter' },
    { ar: 'أضف دعوة واضحة للطلب', en: 'Add a clear call to order' },
  ],
  voice: [
    { ar: 'صوت نسائي وأبطأ', en: 'A female voice, slower' },
    { ar: 'اجعل النبرة أهدأ', en: 'Make the tone calmer' },
  ],
  textVideo: [
    { ar: 'اجعل الإضاءة أدفأ', en: 'Make the light warmer' },
    { ar: 'احذف الموسيقى', en: 'Remove the music' },
  ],
  imageVideo: [
    { ar: 'اجعل حركة الكاميرا أبطأ', en: 'Slow the camera down' },
    { ar: 'احذف الموسيقى', en: 'Remove the music' },
  ],
  editVideo: [
    { ar: 'احذف الموسيقى', en: 'Remove the music' },
    { ar: 'ترجم الكلام إلى الإنجليزية', en: 'Translate the captions into Arabic' },
  ],
};

// A short note on a finished result for the assistant planning a change.
function describeResult(job: ServiceJob): string {
  const r = job.result;
  if (!r) return '';
  switch (job.params.kind) {
    case 'copy':
      return r.type === 'text' ? `The previous text:\n${r.text.slice(0, 1800)}` : '';
    case 'adImage':
      return `An ad image designed from the customer's product photo with these instructions: ${job.params.prompt}`;
    case 'voice':
      return `A voice-over of the text in the ${job.params.voice === 'sarah' ? 'female (sarah)' : 'male (brian)'} voice.`;
    case 'textVideo':
    case 'imageVideo':
      return `A ${job.params.duration}-second vertical video made from: ${job.params.prompt}${job.params.music ? `, with music: ${job.params.music}` : ', without music'}.`;
    case 'editVideo': {
      const p = job.params;
      return `The customer's own ${Math.round(job.media?.seconds ?? 0)}-second video, edited: ${[
        p.trimStart !== null || p.trimEnd !== null ? `trimmed ${p.trimStart ?? 0}-${p.trimEnd ?? 'end'} s` : 'not trimmed',
        p.captions ? `captions ${p.captionLanguage ? `translated into ${p.captionLanguage}` : 'in the spoken language'}` : 'no captions',
        p.music ? `music "${p.music}" ${p.musicMode === 'under' ? 'under the voice' : 'replacing the sound'}` : 'no music',
      ].join(', ')}.`;
    }
  }
}

// Order ids and times come from the clock when the customer confirms.
function newOrderId() {
  const at = Date.now();
  return { id: `S-${at.toString(36).toUpperCase()}`, at };
}

type Revision = { instruction: string; reply: string; title: string; params: ServiceParams };

// One order's receipt: it runs as soon as it opens, shows each step as it
// happens, then the result. Once there is a result the order reads as a
// conversation: the request, the result, then any change the customer asks
// for with its own price and result. A failed order can be retried.
export default function JobScreen() {
  const { c } = useTheme();
  const i18n = useI18n();
  const { L, pick, lang, rtl } = i18n;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { jobs, updateJob, addJob, priceFor } = useServices();
  const business = useBusiness();
  const job = jobs.find((j) => j.id === id);
  const started = useRef(false);
  const scroll = useRef<ScrollViewInstance>(null);
  // Celebrate only an order seen running here, not one opened already done.
  const [sawRunning, setSawRunning] = useState(false);
  if (job && job.status !== 'done' && !sawRunning) setSawRunning(true);
  const [change, setChange] = useState('');
  const [planning, setPlanning] = useState(false);
  const [question, setQuestion] = useState<{ ask: string; reply: string } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [revision, setRevision] = useState<Revision | null>(null);
  const [tier, setTier] = useState<ServiceTier>('mid');
  const [showWhy, setShowWhy] = useState(false);

  const run = (target: ServiceJob) => {
    started.current = true;
    updateJob(target.id, { status: 'running', error: undefined, step: '', progress: 0 });
    runOrder(target.params, target.media, business, target.tier, lang, (step, progress) => updateJob(target.id, { step, progress }), {
      images: target.images ?? [],
      sourceUrls: target.sourceUrls,
      onUploaded: (urls) => updateJob(target.id, { sourceUrls: urls }),
      revise: target.revise,
    })
      .then((result) => updateJob(target.id, { status: 'done', result, progress: 1, step: '' }))
      .catch((err) => updateJob(target.id, { status: 'failed', error: failCode(err) }));
  };
  const start = () => {
    if (job) run(job);
  };

  useEffect(() => {
    if (job?.status === 'pending' && !started.current) start();
    // Runs once per opened order; `start` reads the latest job.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status]);

  // A change opens at the bottom of its thread, where it runs.
  const isChange = (job?.version ?? 1) > 1;
  useEffect(() => {
    if (!isChange) return;
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: false }), 300);
    return () => clearTimeout(t);
  }, [isChange, id]);

  const leave = () => router.dismissTo('/');

  if (!job) {
    return (
      <ScrollScreen header={<TopBar title={L('الطلب', 'Order')} />}>
        <Note>{L('هذا الطلب غير موجود على هذا الجهاز.', 'This order is not on this device.')}</Note>
      </ScrollScreen>
    );
  }

  const thread = threadOf(jobs, job);
  const root = thread[0];
  const latest = thread[thread.length - 1];
  const stepsOf = (j: ServiceJob) => stepsFor(j.params, needsUpload(j), j.tier);
  const runSteps = stepsOf(job);
  const current = runSteps.indexOf(job.step as StepKey);
  const done = job.status === 'done';
  const failed = job.status === 'failed';
  const pct = Math.round((done ? 1 : job.progress) * 100);
  const error = failMessage(job.error, lang);
  const track: { label: string; state: StepState }[] = [
    { label: L('تأكيد الطلب', 'Order confirmed'), state: 'done' },
    ...runSteps.map((s, i) => ({
      label: pick(stepNames[s]),
      state: (done || current > i ? 'done' : job.status === 'running' && (current === i || (current < 0 && i === 0)) ? 'now' : 'todo') as StepState,
    })),
    { label: L('التسليم', 'Delivery'), state: (done ? 'done' : 'todo') as StepState },
  ];
  const share = () => Share.share({ message: receiptText(job, i18n) }).catch(() => undefined);

  const celebrate = done && sawRunning;
  const ticket = (
    <Card style={styles.ticket}>
      <View style={styles.ticketHead}>
        <View>
          <AppText size={11} lineHeight={16} color={c.muted}>
            {L('رقم الطلب', 'Order number')}
          </AppText>
          <AppText weight="bold" size={14} lineHeight={20} style={styles.orderId}>
            {job.id}
          </AppText>
        </View>
        <View style={styles.dateCol}>
          <AppText size={11} lineHeight={16} color={c.muted}>
            {L('التاريخ', 'Date')}
          </AppText>
          <AppText weight="semibold" size={13} lineHeight={19}>
            {`${formatDate(job.createdAt, lang)} · ⁦${formatTime(job.createdAt)}⁩`}
          </AppText>
        </View>
      </View>
      <View style={styles.perforation}>
        <View style={[styles.perfLine, { borderColor: c.line }]} />
        <View style={[styles.notch, styles.notchLeft]}>
          <View style={[styles.notchCircle, styles.notchCircleLeft, { backgroundColor: c.bg, borderColor: c.line }]} />
        </View>
        <View style={[styles.notch, styles.notchRight]}>
          <View style={[styles.notchCircle, { backgroundColor: c.bg, borderColor: c.line }]} />
        </View>
      </View>
      <View style={styles.ticketBody}>
        <KeyValue icon={serviceIcons[job.kind]} label={L('الخدمة', 'Service')} value={pick(services[job.kind].name)} />
        {(job.version ?? 1) > 1 && <KeyValue icon="refresh" divider label={L('النسخة', 'Version')} value={L(`تعديل · النسخة ${job.version}`, `Change · version ${job.version}`)} />}
        <KeyValue icon="layers" divider label={L('المستوى', 'Level')} value={levelLabel(job, i18n)} />
        <KeyValue icon="cpu" divider label={L('النماذج', 'Models')} value={modelNames(job)} ltrValue />
        <KeyValue icon="receipt" divider strong label={L('الإجمالي', 'Total')} value={formatIQD(job.quote.totalIqd)} />
      </View>
    </Card>
  );

  // A first order that has not finished keeps the receipt with its steps.
  if (thread.length === 1 && !done) {
    return (
      <ScrollScreen
        header={<TopBar mode="close" title={L('إيصال الطلب', 'Order receipt')} onBack={leave} right={<IconButton icon="receipt" label={L('شارك الإيصال', 'Share the receipt')} onPress={share} />} />}>
        <View style={styles.seal}>
          {failed ? <IconBadge icon="alert" tone="bad" size={56} /> : <SuccessSeal />}
          <AppText variant="h2" center style={styles.sealTitle}>
            {failed ? L('لم يكتمل الطلب', 'The order did not finish') : L('تم تأكيد طلبك', 'Your order is confirmed')}
          </AppText>
          <AppText variant="small" color={c.muted} center>
            {failed ? L('يمكنك إعادة المحاولة دون طلب جديد.', 'You can try again without a new order.') : L('بدأ التنفيذ، وسنعرض النتيجة هنا عند اكتماله.', 'The run has started; the result shows here when it is done.')}
          </AppText>
        </View>
        {ticket}
        <Card style={styles.status}>
          <View style={styles.between}>
            <AppText variant="h3">{L('حالة التنفيذ', 'Progress')}</AppText>
            {failed ? <Badge tone="bad" label={L('متوقف', 'Stopped')} /> : <Badge tone="warn" icon="clock" label={`⁦${pct}%⁩`} />}
          </View>
          <Progress value={job.progress} />
          {track.length <= 5 ? (
            <StepTrack steps={track} />
          ) : (
            <View style={styles.list}>
              {track.map((s, i) => (
                <View key={`${s.label}${i}`} style={styles.listStep}>
                  <View
                    style={[
                      styles.dot,
                      s.state === 'done'
                        ? { backgroundColor: c.ok }
                        : s.state === 'now'
                          ? { borderWidth: 2, borderColor: c.accent, backgroundColor: c.card }
                          : { borderWidth: 1.5, borderColor: c.lineStrong },
                    ]}>
                    {s.state === 'done' && <Icon name="check" color={c.card} size={12} strokeWidth={2.6} />}
                    {s.state === 'now' && <View style={[styles.nowDot, { backgroundColor: c.accent }]} />}
                  </View>
                  <AppText size={13} lineHeight={19} weight={s.state === 'now' ? 'semibold' : 'regular'} color={s.state === 'todo' ? c.placeholder : c.text}>
                    {s.label}
                  </AppText>
                </View>
              ))}
            </View>
          )}
        </Card>
        {failed ? (
          <>
            <Note tone="bad" icon="alert">
              {error}
            </Note>
            <Button label={L('أعد المحاولة', 'Try again')} icon="refresh" onPress={start} />
          </>
        ) : (
          <Note>{L('أبقِ التطبيق مفتوحًا حتى ينتهي التنفيذ؛ قد يستغرق الفيديو بضع دقائق.', 'Keep the app open until the run finishes; video can take a few minutes.')}</Note>
        )}
        <WhyPrice quote={job.quote} />
        <View style={styles.actions}>
          <Button label={L('الإيصال', 'Receipt')} icon="download" variant="secondary" style={styles.receiptBtn} onPress={share} />
          {failed ? (
            <Button label={L('طلب جديد', 'New order')} style={styles.flex} onPress={() => router.dismissTo('/services')} />
          ) : (
            <Button label={L('إلى الرئيسية', 'Back to home')} style={styles.flex} onPress={leave} />
          )}
        </View>
      </ScrollScreen>
    );
  }

  // A change is planned from the latest version and priced like any order:
  // it runs the models again on the original files.
  const ask = async () => {
    const instruction = change.trim();
    if (!instruction || planning || latest.status !== 'done') return;
    setPlanning(true);
    setNote(null);
    setQuestion(null);
    try {
      const r = await postJson<{ reply: string; ready: boolean; title: string; params: ServiceParams | null }>(
        '/api/plan',
        { mode: 'revise', business, parent: { kind: latest.kind, params: latest.params, result: describeResult(latest) }, instruction },
        90000,
      );
      if (r.ready && r.params && r.params.kind === latest.kind) {
        setRevision({ instruction, reply: r.reply, title: r.title || latest.title, params: r.params });
        setTier(latest.tier);
        setShowWhy(false);
        setChange('');
      } else {
        setQuestion({ ask: instruction, reply: r.reply || L('وضّح التعديل الذي تريده من فضلك.', 'Please say a little more about the change you want.') });
      }
    } catch (err) {
      setNote(aiErrorText(err, lang, err instanceof AiUnavailable ? 'order' : 'chat'));
    } finally {
      setPlanning(false);
    }
  };

  const media = latest.media ?? root.media;
  const quotes: Record<ServiceTier, Quote> | null = revision
    ? {
        low: priceFor(revision.params, media?.seconds ?? 0, 'low', media?.bytes ?? 0),
        mid: priceFor(revision.params, media?.seconds ?? 0, 'mid', media?.bytes ?? 0),
        high: priceFor(revision.params, media?.seconds ?? 0, 'high', media?.bytes ?? 0),
      }
    : null;
  const nextVersion = (latest.version ?? 1) + 1;

  const confirm = () => {
    if (!revision || !quotes) return;
    const { id: newId, at } = newOrderId();
    const prev = latest.result;
    addJob({
      id: newId,
      kind: latest.kind,
      // The thread keeps its first title; the change itself is the request.
      title: root.title || revision.title,
      params: revision.params,
      tier,
      media: latest.media ?? root.media,
      images: latest.images ?? root.images,
      // The files the first version uploaded; nothing is uploaded again.
      sourceUrls: latest.sourceUrls ?? root.sourceUrls,
      rootId: root.id,
      parentId: latest.id,
      version: nextVersion,
      request: revision.instruction,
      revise: {
        instruction: revision.instruction,
        imageUrl: latest.kind === 'adImage' && prev?.type === 'image' ? prev.url : undefined,
        text: latest.kind === 'copy' && prev?.type === 'text' ? prev.text : undefined,
      },
      quote: quotes[tier],
      status: 'pending',
      step: '',
      progress: 0,
      createdAt: at,
    });
    setRevision(null);
    router.replace({ pathname: '/job/[id]', params: { id: newId } });
  };

  if (revision && quotes) {
    const q = quotes[tier];
    return (
      <Screen edges={['top']}>
        <TopBar title={L(`سعر التعديل · النسخة ${nextVersion}`, `Change price · version ${nextVersion}`)} onBack={() => setRevision(null)} />
        <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
          <RequestBubble label={L('طلب التعديل', 'Your change')} text={revision.instruction} />
          {revision.reply ? <ReplyBubble text={revision.reply} /> : null}
          <Note tone="info" icon="refresh">
            {L(
              'التعديل طلب جديد: يعيد تشغيل نماذج الذكاء الاصطناعي، لذا له سعره ومستواه. تبقى النسخ السابقة في المحادثة.',
              'A change is a new order: it runs the AI models again, so it has its own level and price. Earlier versions stay in the conversation.',
            )}
          </Note>
          <SectionTitle title={L('اختر المستوى', 'Choose a level')} />
          <LevelPicker params={revision.params} quotes={quotes} tier={tier} onChange={setTier} />
          <WhyPrice quote={q} open={showWhy} onToggle={() => setShowWhy((v) => !v)} />
        </ScrollView>
        <Footer style={styles.totalBar}>
          <View>
            <AppText size={11} lineHeight={16} color={c.muted}>
              {L(`الإجمالي · مستوى ${pick(tierNames[tier])}`, `Total · ${pick(tierNames[tier])} level`)}
            </AppText>
            <AppText weight="bold" size={20} lineHeight={28}>
              {formatIQD(q.totalIqd)}
            </AppText>
          </View>
          <Button label={L('نفّذ التعديل', 'Make the change')} style={ui.flex} onPress={confirm} />
        </Footer>
      </Screen>
    );
  }

  const canChange = latest.status === 'done';
  const busyThread = thread.some((j) => j.status === 'running' || j.status === 'pending');
  const latestRunning = latest.status === 'running' || latest.status === 'pending';
  return (
    <Screen edges={['top']}>
      <TopBar
        mode="close"
        title={thread.length > 1 ? L('طلبك وتعديلاته', 'Your order and changes') : L('نتيجة طلبك', 'Your result')}
        onBack={leave}
        right={<IconButton icon="receipt" label={L('شارك الإيصال', 'Share the receipt')} onPress={share} />}
      />
      <KeyboardAvoidingView style={ui.flex} behavior="padding">
        <ScrollView ref={scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.seal}>
            {latest.status === 'failed' ? <IconBadge icon="alert" tone="bad" size={56} /> : latestRunning ? <SuccessSeal /> : <DoneSeal celebrate={celebrate} />}
            <Reveal animate={celebrate} delay={260}>
              <AppText variant="h2" center style={styles.sealTitle}>
                {latestRunning
                  ? L('نعمل على التعديل', 'Making your change')
                  : latest.status === 'failed'
                    ? L('لم يكتمل التعديل', 'The change did not finish')
                    : thread.length > 1
                      ? L(`النسخة ${latest.version ?? thread.length} جاهزة`, `Version ${latest.version ?? thread.length} is ready`)
                      : L('طلبك جاهز', 'Your order is ready')}
              </AppText>
              <AppText variant="small" color={c.muted} center>
                {latestRunning
                  ? L('تبقى النسخ السابقة كما هي بالأسفل.', 'Earlier versions stay as they are below.')
                  : L('احفظه على جهازك أو انشره، أو اطلب تعديلًا بالأسفل.', 'Save it, post it, or ask for a change below.')}
              </AppText>
            </Reveal>
          </View>

          {thread.map((v) => (
            <View key={v.id} style={styles.turn}>
              <RequestBubble
                label={(v.version ?? 1) > 1 ? L(`طلب تعديل · النسخة ${v.version}`, `Change request · version ${v.version}`) : L('طلبك', 'Your request')}
                text={v.request || v.title || pick(services[v.kind].name)}
              />
              {(v.version ?? 1) > 1 && <VersionQuote job={v} />}
              <Reveal animate={celebrate && v.id === job.id} delay={480}>
                <VersionResult job={v} steps={stepsOf(v)} onRetry={() => run(v)} />
              </Reveal>
            </View>
          ))}

          {question && (
            <View style={styles.turn}>
              <RequestBubble label={L('طلب تعديل', 'Change request')} text={question.ask} />
              <ReplyBubble text={question.reply} />
            </View>
          )}
          {canChange && (
            <View style={styles.ideas}>
              {changeIdeas[latest.kind].map((idea) => (
                <Chip key={idea.en} label={pick(idea)} selected={false} icon="edit" onPress={() => setChange(pick(idea))} />
              ))}
            </View>
          )}
          {note && (
            <Note tone="bad" icon="alert">
              {note}
            </Note>
          )}

          <SectionTitle title={L('تفاصيل الطلب', 'Order details')} />
          {ticket}
          <WhyPrice quote={job.quote} />
          <View style={styles.actions}>
            <Button label={L('الإيصال', 'Receipt')} icon="download" variant="secondary" style={styles.receiptBtn} onPress={share} />
            <Button label={L('طلب جديد', 'New order')} variant="secondary" style={styles.flex} onPress={() => router.dismissTo('/services')} />
          </View>
        </ScrollView>

        <Footer style={styles.composerBar}>
          {canChange ? (
            <>
              <AppText size={11.5} lineHeight={16} color={c.muted}>
                {L('يُسعَّر التعديل كطلب جديد، وترى سعره قبل التنفيذ.', 'A change is priced as a new order; you see its price first.')}
              </AppText>
              <View style={styles.inputRow}>
                <TextInput
                  value={change}
                  onChangeText={setChange}
                  placeholder={L('اطلب تعديلًا على النتيجة', 'Ask for a change')}
                  accessibilityLabel={L('اطلب تعديلًا على النتيجة', 'Ask for a change to the result')}
                  placeholderTextColor={c.placeholder}
                  multiline
                  maxLength={600}
                  style={[styles.input, { color: c.text, backgroundColor: c.card, borderColor: c.line, textAlign: rtl ? 'right' : 'left' }]}
                />
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={L('اعرض سعر التعديل', 'See the price of the change')}
                  disabled={!change.trim() || planning}
                  onPress={ask}
                  style={[styles.send, { backgroundColor: change.trim() && !planning ? c.primary : c.tile }]}>
                  <Icon name="send" color={change.trim() && !planning ? c.onPrimary : c.placeholder} size={18} strokeWidth={1.8} />
                </PressableScale>
              </View>
              {planning && (
                <AppText size={12} lineHeight={17} color={c.muted}>
                  {L('يجهّز المساعد التعديل وسعره…', 'Preparing the change and its price…')}
                </AppText>
              )}
            </>
          ) : (
            <AppText size={12} lineHeight={17} color={c.muted} center>
              {busyThread
                ? L('يمكنك طلب تعديل آخر بعد أن تجهز هذه النسخة.', 'You can ask for another change once this version is ready.')
                : L('أعد محاولة النسخة المتوقفة أو اطلب طلبًا جديدًا.', 'Retry the stopped version or place a new order.')}
            </AppText>
          )}
        </Footer>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seal: { alignItems: 'center', gap: 2, paddingTop: 4 },
  sealBox: { width: SEAL, height: SEAL, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: SEAL, height: SEAL, borderRadius: SEAL / 2, borderWidth: 1.5 },
  sealTitle: { marginTop: 10 },
  ticket: { padding: 0, gap: 0, marginTop: 4 },
  ticketHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  orderId: { letterSpacing: 0.5, writingDirection: 'ltr', alignSelf: 'flex-start' },
  dateCol: { alignItems: 'flex-end', flexShrink: 1 },
  perforation: { height: 2, justifyContent: 'center' },
  perfLine: { marginHorizontal: 16, borderTopWidth: 1.5, borderStyle: 'dashed' },
  notch: { position: 'absolute', top: -10, width: 11, height: 20, overflow: 'hidden' },
  notchLeft: { left: -1 },
  notchRight: { right: -1 },
  notchCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1 },
  notchCircleLeft: { marginLeft: -10 },
  ticketBody: { paddingTop: 4, paddingBottom: 6, paddingHorizontal: 16 },
  status: { paddingVertical: 14, gap: 12 },
  list: { gap: 10 },
  listStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  nowDot: { width: 6, height: 6, borderRadius: 3 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  page: { paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: 24, gap: 14 },
  turn: { gap: 10 },
  ideas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  totalBar: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  composerBar: { gap: 6, paddingTop: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, minHeight: 46, maxHeight: 120, borderRadius: radius.control, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontFamily: font.regular, fontSize: 14 },
  send: { width: 46, height: 46, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  receiptBtn: { width: 130 },
});
