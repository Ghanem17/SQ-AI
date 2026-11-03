import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatIQD, formatUsd, serviceTools, services } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Badge, Card, Divider, KeyValue, Note, Progress, ScrollScreen, SectionTitle, TopBar, ui } from '@/components/ui';
import { useBusiness } from '@/lib/ai';
import { ResultView } from '@/features/services/Result';
import { explain, runOrder, stepsFor } from '@/features/services/runner';
import { useServices } from '@/features/services/store';
import { useTheme } from '@/theme/theme';

// One order: it runs as soon as it opens, shows each step as it happens,
// then the result. A failed or interrupted order can be retried.
export default function JobScreen() {
  const { c } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { jobs, updateJob } = useServices();
  const business = useBusiness();
  const job = jobs.find((j) => j.id === id);
  const started = useRef(false);

  const start = () => {
    if (!job) return;
    started.current = true;
    updateJob(job.id, { status: 'running', error: undefined, step: '', progress: 0 });
    runOrder(job.params, job.media, business, (step, progress) => updateJob(job.id, { step, progress }))
      .then((result) => updateJob(job.id, { status: 'done', result, progress: 1, step: '' }))
      .catch((err) => updateJob(job.id, { status: 'failed', error: explain(err) }));
  };

  useEffect(() => {
    if (job?.status === 'pending' && !started.current) start();
    // Runs once per opened order; `start` reads the latest job.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status]);

  if (!job) {
    return (
      <ScrollScreen header={<TopBar title="الطلب" />}>
        <Note>هذا الطلب غير موجود على هذا الجهاز.</Note>
      </ScrollScreen>
    );
  }

  const steps = stepsFor(job.params, Boolean(job.media));
  const current = steps.indexOf(job.step);

  return (
    <ScrollScreen
      header={<TopBar title={job.title} subtitle={`${services[job.kind].name} · ${job.id}`} onBack={() => router.dismissTo('/(tabs)')} />}
      footer={job.status === 'done' || job.status === 'failed' ? <Button label="طلب جديد" variant="secondary" onPress={() => router.replace('/order')} /> : undefined}>
      <Card>
        <View style={ui.between}>
          <AppText weight="semibold" size={15}>
            {job.status === 'done' ? 'جاهز' : job.status === 'failed' ? 'ما اكتمل' : 'قيد التنفيذ'}
          </AppText>
          <Badge
            label={job.status === 'done' ? 'تم' : job.status === 'failed' ? 'متوقف' : `${Math.round(job.progress * 100)}%`}
            tone={job.status === 'done' ? 'ok' : job.status === 'failed' ? 'bad' : 'pri'}
          />
        </View>
        {job.status !== 'done' && <Progress value={job.status === 'failed' ? job.progress : Math.max(0.05, job.progress)} />}
        <View style={styles.steps}>
          {steps.map((s, i) => {
            const done = job.status === 'done' || (current > i);
            const now = job.status === 'running' && current === i;
            return (
              <View key={s} style={styles.step}>
                <View style={[styles.dot, { backgroundColor: done ? c.ok : now ? c.primary : c.track }]}>
                  {done && <Icon name="check" color={c.card} size={11} strokeWidth={3} />}
                </View>
                <AppText size={13.5} weight={now ? 'semibold' : 'regular'} color={done || now ? c.text : c.muted}>
                  {s}
                  {now ? '…' : ''}
                </AppText>
              </View>
            );
          })}
        </View>
        {job.status === 'running' && (
          <AppText size={12} color={c.placeholder}>
            خلّي التطبيق مفتوحًا لحد ما يخلص. الفيديو ممكن ياخد بضع دقائق.
          </AppText>
        )}
      </Card>

      {job.status === 'failed' && (
        <>
          <Note tone="bad" icon="alert">
            {job.error ?? 'تعذر إكمال الطلب.'}
          </Note>
          <Button label="أعد المحاولة" icon="refresh" onPress={start} />
        </>
      )}

      {job.status === 'done' && job.result && (
        <>
          <SectionTitle title="النتيجة" />
          <ResultView result={job.result} />
        </>
      )}

      <SectionTitle title="ليش هالسعر؟" />
      <Card>
        {job.quote.lines.map((l, i) => (
          <KeyValue
            key={`${l.tool}${i}`}
            label={`${serviceTools[l.tool].name} · ${l.task}`}
            sub={`الكمية ${l.qty} ${serviceTools[l.tool].unit} · \u2066${formatUsd(l.unitUsd)}\u2069 لكل ${serviceTools[l.tool].unit}`}
            value={formatIQD(l.costIqd)}
          />
        ))}
        <Divider />
        <KeyValue label="رسوم الخدمة" value={formatIQD(job.quote.feeIqd)} />
        <KeyValue label="المجموع" value={formatIQD(job.quote.totalIqd)} strong />
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  steps: { gap: 10, marginTop: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
