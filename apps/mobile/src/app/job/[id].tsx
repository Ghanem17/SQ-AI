import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, Share, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInUp, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

import { formatDate, formatIQD, formatTime, serviceTools, services, tierNames, videoSeconds, type ServiceToolKey } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { SuccessSeal } from '@/components/brand';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Badge, Card, IconBadge, IconButton, KeyValue, Note, Progress, ScrollScreen, SectionTitle, StepTrack, TopBar, type StepState } from '@/components/ui';
import { useI18n, type I18n } from '@/i18n';
import { useBusiness } from '@/lib/ai';
import { serviceIcons } from '@/features/services/OrderRow';
import { ResultView } from '@/features/services/Result';
import { WhyPrice } from '@/features/services/WhyPrice';
import { failCode, failMessage, runOrder, stepNames, stepsFor, type StepKey } from '@/features/services/runner';
import { useServices, type ServiceJob } from '@/features/services/store';
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

// One order's receipt: it runs as soon as it opens, shows each step as it
// happens, then the result. A failed or interrupted order can be retried.
export default function JobScreen() {
  const { c } = useTheme();
  const i18n = useI18n();
  const { L, pick, lang } = i18n;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { jobs, updateJob } = useServices();
  const business = useBusiness();
  const job = jobs.find((j) => j.id === id);
  const started = useRef(false);
  // Celebrate only an order seen running here, not one opened already done.
  const [sawRunning, setSawRunning] = useState(false);
  if (job && job.status !== 'done' && !sawRunning) setSawRunning(true);

  const start = () => {
    if (!job) return;
    started.current = true;
    updateJob(job.id, { status: 'running', error: undefined, step: '', progress: 0 });
    runOrder(job.params, job.media, business, job.tier, lang, (step, progress) => updateJob(job.id, { step, progress }), job.images ?? [])
      .then((result) => updateJob(job.id, { status: 'done', result, progress: 1, step: '' }))
      .catch((err) => updateJob(job.id, { status: 'failed', error: failCode(err) }));
  };

  useEffect(() => {
    if (job?.status === 'pending' && !started.current) start();
    // Runs once per opened order; `start` reads the latest job.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status]);

  const leave = () => router.dismissTo('/');

  if (!job) {
    return (
      <ScrollScreen header={<TopBar title={L('الطلب', 'Order')} />}>
        <Note>{L('هذا الطلب غير موجود على هذا الجهاز.', 'This order is not on this device.')}</Note>
      </ScrollScreen>
    );
  }

  const runSteps = stepsFor(job.params, Boolean(job.media) || Boolean(job.images?.length), job.tier);
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
        <KeyValue icon="layers" divider label={L('المستوى', 'Level')} value={levelLabel(job, i18n)} />
        <KeyValue icon="cpu" divider label={L('النماذج', 'Models')} value={modelNames(job)} ltrValue />
        <KeyValue icon="receipt" divider strong label={L('الإجمالي', 'Total')} value={formatIQD(job.quote.totalIqd)} />
      </View>
    </Card>
  );

  return (
    <ScrollScreen
      header={<TopBar mode="close" title={done ? L('نتيجة طلبك', 'Your result') : L('إيصال الطلب', 'Order receipt')} onBack={leave} right={<IconButton icon="receipt" label={L('شارك الإيصال', 'Share the receipt')} onPress={share} />} />}>
      <View style={styles.seal}>
        {failed ? <IconBadge icon="alert" tone="bad" size={56} /> : done ? <DoneSeal celebrate={celebrate} /> : <SuccessSeal />}
        <Reveal animate={celebrate} delay={260}>
          <AppText variant="h2" center style={styles.sealTitle}>
            {done ? L('طلبك جاهز', 'Your order is ready') : failed ? L('لم يكتمل الطلب', 'The order did not finish') : L('تم تأكيد طلبك', 'Your order is confirmed')}
          </AppText>
          <AppText variant="small" color={c.muted} center>
            {done
              ? L('انشره الآن أو احفظه على جهازك.', 'Post it now or save it to your device.')
              : failed
                ? L('يمكنك إعادة المحاولة دون طلب جديد.', 'You can try again without a new order.')
                : L('بدأ التنفيذ، وسنعرض النتيجة هنا عند اكتماله.', 'The run has started; the result shows here when it is done.')}
          </AppText>
        </Reveal>
      </View>

      {done && job.result && (
        <Reveal animate={celebrate} delay={480}>
          <ResultView job={job} result={job.result} />
        </Reveal>
      )}

      {done ? (
        <>
          <SectionTitle title={L('تفاصيل الطلب', 'Order details')} />
          {ticket}
        </>
      ) : (
        <>
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
        </>
      )}

      {job.status === 'running' || job.status === 'pending' ? (
        <Note>{L('أبقِ التطبيق مفتوحًا حتى ينتهي التنفيذ؛ قد يستغرق الفيديو بضع دقائق.', 'Keep the app open until the run finishes; video can take a few minutes.')}</Note>
      ) : null}

      {failed && (
        <>
          <Note tone="bad" icon="alert">
            {error}
          </Note>
          <Button label={L('أعد المحاولة', 'Try again')} icon="refresh" onPress={start} />
        </>
      )}

      <WhyPrice quote={job.quote} />

      <View style={styles.actions}>
        <Button label={L('الإيصال', 'Receipt')} icon="download" variant="secondary" style={styles.receiptBtn} onPress={share} />
        {done || failed ? (
          <Button label={L('طلب جديد', 'New order')} style={styles.flex} onPress={() => router.dismissTo('/services')} />
        ) : (
          <Button label={L('إلى الرئيسية', 'Back to home')} style={styles.flex} onPress={leave} />
        )}
      </View>
    </ScrollScreen>
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
  receiptBtn: { width: 130 },
});
