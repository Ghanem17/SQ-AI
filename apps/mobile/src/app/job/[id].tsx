import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { formatDate, formatIQD, formatTime, serviceTools, services, tierNames, tierQuality, videoSeconds, type ServiceToolKey } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { SuccessSeal } from '@/components/brand';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Badge, Card, Divider, IconBadge, IconButton, KeyValue, Note, Progress, ScrollScreen, SectionTitle, StepTrack, TopBar, type StepState } from '@/components/ui';
import { useI18n, type I18n } from '@/i18n';
import { useBusiness } from '@/lib/ai';
import { serviceIcons } from '@/features/services/OrderRow';
import { ResultView } from '@/features/services/Result';
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

  const start = () => {
    if (!job) return;
    started.current = true;
    updateJob(job.id, { status: 'running', error: undefined, step: '', progress: 0 });
    runOrder(job.params, job.media, business, job.tier, lang, (step, progress) => updateJob(job.id, { step, progress }))
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

  const runSteps = stepsFor(job.params, Boolean(job.media), job.tier);
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

  return (
    <ScrollScreen
      header={<TopBar mode="close" title={L('إيصال الطلب', 'Order receipt')} onBack={leave} right={<IconButton icon="share" label={L('شارك الإيصال', 'Share the receipt')} onPress={share} />} />}>
      <View style={styles.seal}>
        {failed ? <IconBadge icon="alert" tone="bad" size={56} /> : <SuccessSeal />}
        <AppText variant="h2" center style={styles.sealTitle}>
          {done ? L('طلبك جاهز', 'Your order is ready') : failed ? L('لم يكتمل الطلب', 'The order did not finish') : L('تم تأكيد طلبك', 'Your order is confirmed')}
        </AppText>
        <AppText variant="small" color={c.muted} center>
          {done
            ? L('النتيجة أدناه، احفظها على جهازك.', 'The result is below; save it to your device.')
            : failed
              ? L('يمكنك إعادة المحاولة دون طلب جديد.', 'You can try again without a new order.')
              : L('بدأ التنفيذ، وسنعرض النتيجة هنا عند اكتماله.', 'The run has started; the result shows here when it is done.')}
        </AppText>
      </View>

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

      <Card style={styles.status}>
        <View style={styles.between}>
          <AppText variant="h3">{L('حالة التنفيذ', 'Progress')}</AppText>
          {done ? (
            <Badge tone="ok" icon="check" label={L('تم', 'Done')} />
          ) : failed ? (
            <Badge tone="bad" label={L('متوقف', 'Stopped')} />
          ) : (
            <Badge tone="warn" icon="clock" label={`⁦${pct}%⁩`} />
          )}
        </View>
        <Progress value={done ? 1 : job.progress} />
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

      {done && job.result && (
        <>
          <SectionTitle title={L('النتيجة', 'Result')} />
          <ResultView result={job.result} />
        </>
      )}

      <View style={styles.actions}>
        <Button label={L('الإيصال', 'Receipt')} icon="download" variant="secondary" style={styles.receiptBtn} onPress={share} />
        {done || failed ? (
          <Button label={L('طلب جديد', 'New order')} style={styles.flex} onPress={() => router.replace('/order')} />
        ) : (
          <Button label={L('إلى الرئيسية', 'Back to home')} style={styles.flex} onPress={leave} />
        )}
      </View>

      <SectionTitle title={L('لماذا هذا السعر؟', 'Why this price?')} />
      <Card style={styles.why}>
        <AppText variant="small" color={c.muted}>
          {pick(tierQuality[job.kind][job.tier])}
        </AppText>
        <Divider style={styles.gap} />
        {job.quote.lines.map((l, i) => (
          <View key={`${l.tool}${i}`} style={styles.line}>
            <View style={styles.flex}>
              <AppText weight="semibold" size={13} lineHeight={19} style={styles.ltrStart}>
                {serviceTools[l.tool].name}
              </AppText>
              <AppText size={11} lineHeight={16} color={c.muted}>
                {pick(l.task)}
              </AppText>
            </View>
            <AppText size={12.5} lineHeight={18} weight="semibold">
              {formatIQD(l.costIqd)}
            </AppText>
          </View>
        ))}
        <Divider dashed style={styles.gap} />
        <View style={styles.line}>
          <AppText variant="small" color={c.muted} style={styles.flex}>
            {L('رسوم الخدمة', 'Service fee')}
          </AppText>
          <AppText size={12.5} lineHeight={18} weight="semibold">
            {formatIQD(job.quote.feeIqd)}
          </AppText>
        </View>
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seal: { alignItems: 'center', gap: 2, paddingTop: 4 },
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
  why: { paddingVertical: 12, paddingHorizontal: 14, gap: 0 },
  gap: { marginVertical: 6 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingVertical: 4 },
  ltrStart: { writingDirection: 'ltr', alignSelf: 'flex-start' },
});
