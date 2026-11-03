import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatIQD, formatUsd, serviceTools, services, tierNames, tierQuality } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Badge, Card, Divider, KeyValue, Note, Progress, ScrollScreen, SectionTitle, TopBar, ui } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useBusiness } from '@/lib/ai';
import { ResultView } from '@/features/services/Result';
import { explain, runOrder, stepNames, stepsFor, type StepKey } from '@/features/services/runner';
import { useServices } from '@/features/services/store';
import { useTheme } from '@/theme/theme';

// One order: it runs as soon as it opens, shows each step as it happens,
// then the result. A failed or interrupted order can be retried.
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
      .catch((err) => updateJob(job.id, { status: 'failed', error: explain(err, i18n) }));
  };

  useEffect(() => {
    if (job?.status === 'pending' && !started.current) start();
    // Runs once per opened order; `start` reads the latest job.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status]);

  if (!job) {
    return (
      <ScrollScreen header={<TopBar title={L('الطلب', 'Order')} />}>
        <Note>{L('هذا الطلب غير موجود على هذا الجهاز.', 'This order is not on this device.')}</Note>
      </ScrollScreen>
    );
  }

  const steps = stepsFor(job.params, Boolean(job.media), job.tier);
  const current = steps.indexOf(job.step as StepKey);
  const error = job.error === 'interrupted' ? L('توقف التنفيذ لأن التطبيق أُغلق. أعد المحاولة.', 'The run stopped because the app was closed. Try again.') : job.error;

  return (
    <ScrollScreen
      header={<TopBar title={job.title} subtitle={`${pick(services[job.kind].name)} · ${pick(tierNames[job.tier])} · ${job.id}`} onBack={() => router.dismissTo('/(tabs)')} />}
      footer={job.status === 'done' || job.status === 'failed' ? <Button label={L('طلب جديد', 'New order')} variant="secondary" onPress={() => router.replace('/order')} /> : undefined}>
      <Card>
        <View style={ui.between}>
          <AppText weight="semibold" size={15}>
            {job.status === 'done' ? L('جاهز', 'Ready') : job.status === 'failed' ? L('لم يكتمل', 'Not finished') : L('قيد التنفيذ', 'In progress')}
          </AppText>
          <Badge
            label={job.status === 'done' ? L('تم', 'Done') : job.status === 'failed' ? L('متوقف', 'Stopped') : `${Math.round(job.progress * 100)}%`}
            tone={job.status === 'done' ? 'ok' : job.status === 'failed' ? 'bad' : 'pri'}
          />
        </View>
        {job.status !== 'done' && <Progress value={job.status === 'failed' ? job.progress : Math.max(0.05, job.progress)} />}
        <View style={styles.steps}>
          {steps.map((s, i) => {
            const done = job.status === 'done' || current > i;
            const now = job.status === 'running' && current === i;
            return (
              <View key={s} style={styles.step}>
                <View style={[styles.dot, { backgroundColor: done ? c.ok : now ? c.primary : c.track }]}>
                  {done && <Icon name="check" color={c.card} size={11} strokeWidth={3} />}
                </View>
                <AppText size={13.5} weight={now ? 'semibold' : 'regular'} color={done || now ? c.text : c.muted}>
                  {pick(stepNames[s])}
                  {now ? '…' : ''}
                </AppText>
              </View>
            );
          })}
        </View>
        {job.status === 'running' && (
          <AppText size={12} color={c.placeholder}>
            {L('أبقِ التطبيق مفتوحًا حتى ينتهي. قد يستغرق الفيديو بضع دقائق.', 'Keep the app open until it finishes. Video can take a few minutes.')}
          </AppText>
        )}
      </Card>

      {job.status === 'failed' && (
        <>
          <Note tone="bad" icon="alert">
            {error ?? L('تعذر إكمال الطلب.', 'Could not complete the order.')}
          </Note>
          <Button label={L('أعد المحاولة', 'Try again')} icon="refresh" onPress={start} />
        </>
      )}

      {job.status === 'done' && job.result && (
        <>
          <SectionTitle title={L('النتيجة', 'Result')} />
          <ResultView result={job.result} />
        </>
      )}

      <SectionTitle title={L('لماذا هذا السعر؟', 'Why this price?')} />
      <Card>
        <KeyValue label={L('المستوى', 'Level')} sub={pick(tierQuality[job.kind][job.tier])} value={pick(tierNames[job.tier])} />
        <Divider />
        {job.quote.lines.map((l, i) => {
          const tool = serviceTools[l.tool];
          return (
            <KeyValue
              key={`${l.tool}${i}`}
              label={`${tool.name} · ${pick(l.task)}`}
              sub={L(`الكمية ${l.qty} ${tool.unit.ar} · \u2066${formatUsd(l.unitUsd)}\u2069 لكل ${tool.unit.ar}`, `${l.qty} × ${tool.unit.en} at ${formatUsd(l.unitUsd)} each`)}
              value={formatIQD(l.costIqd)}
            />
          );
        })}
        <Divider />
        <KeyValue label={L('رسوم الخدمة', 'Service fee')} value={formatIQD(job.quote.feeIqd)} />
        <KeyValue label={L('المجموع', 'Total')} value={formatIQD(job.quote.totalIqd)} strong />
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  steps: { gap: 10, marginTop: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
