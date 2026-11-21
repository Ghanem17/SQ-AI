// An order as a conversation: the customer's request, its result, then each
// change they asked for with its price and its own result, in order.

import { StyleSheet, View } from 'react-native';

import { formatIQD, levelModel, radius, services, tierNames } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Badge, Card, ModelChip, Note, Progress } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';
import { ResultView } from './Result';
import { failMessage, stepNames, type StepKey } from './runner';
import type { ServiceJob } from './store';

// The customer's words, on the end side like a sent message.
export function RequestBubble({ label, text }: { label: string; text: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.mine}>
      <AppText size={11} lineHeight={15} color={c.muted} style={styles.mineLabel}>
        {label}
      </AppText>
      <View style={[styles.bubble, { backgroundColor: c.primary }]}>
        <AppText size={14} lineHeight={22} color={c.onPrimary}>
          {text}
        </AppText>
      </View>
    </View>
  );
}

// The assistant's side: what it understood, or a question back.
export function ReplyBubble({ text }: { text: string }) {
  const { c } = useTheme();
  return (
    <View style={[styles.bubble, styles.theirs, { backgroundColor: c.card, borderColor: c.line }]}>
      <AppText size={14} lineHeight={22}>
        {text}
      </AppText>
    </View>
  );
}

// The price a change was confirmed at.
export function VersionQuote({ job }: { job: ServiceJob }) {
  const { c } = useTheme();
  const { L, pick } = useI18n();
  return (
    <Card style={styles.quote}>
      <Icon name="receipt" color={c.muted} size={18} />
      <View style={styles.flex}>
        <AppText weight="semibold" size={13} lineHeight={19}>
          {L(`سعر التعديل · مستوى ${pick(tierNames[job.tier])}`, `Change price · ${pick(tierNames[job.tier])} level`)}
        </AppText>
        <View style={styles.quoteRow}>
          <ModelChip label={levelModel(job.params, job.tier)} />
        </View>
      </View>
      <AppText weight="bold" size={14} lineHeight={20}>
        {formatIQD(job.quote.totalIqd)}
      </AppText>
    </Card>
  );
}

// One version's result: the result itself once done, its progress while it
// runs, or why it stopped with a way to try again.
export function VersionResult({ job, steps, onRetry }: { job: ServiceJob; steps: StepKey[]; onRetry: () => void }) {
  const { c } = useTheme();
  const { L, pick, lang } = useI18n();
  const v = job.version ?? 1;
  const label = (
    <View style={styles.resultHead}>
      <Badge tone={job.status === 'done' ? 'ok' : job.status === 'failed' ? 'bad' : 'warn'} small label={L(`النسخة ${v}`, `Version ${v}`)} />
      <AppText size={12} lineHeight={17} color={c.muted} numberOfLines={1} style={styles.flex}>
        {job.title || pick(services[job.kind].name)}
      </AppText>
    </View>
  );
  if (job.status === 'done' && job.result) {
    return (
      <View style={styles.result}>
        {label}
        <ResultView job={job} result={job.result} />
      </View>
    );
  }
  if (job.status === 'failed') {
    return (
      <View style={styles.result}>
        {label}
        <Note tone="bad" icon="alert">
          {failMessage(job.error, lang)}
        </Note>
        <Button label={L('أعد المحاولة', 'Try again')} icon="refresh" variant="secondary" onPress={onRetry} />
      </View>
    );
  }
  const current = steps.indexOf(job.step as StepKey);
  const now = current >= 0 ? steps[current] : steps[0];
  return (
    <View style={styles.result}>
      {label}
      <Card style={styles.running}>
        <View style={styles.resultHead}>
          <Icon name="clock" color={c.accent} size={16} />
          <AppText weight="semibold" size={13.5} lineHeight={20} style={styles.flex}>
            {now ? pick(stepNames[now]) : L('يبدأ التنفيذ…', 'Starting…')}
          </AppText>
          <AppText weight="semibold" size={12.5} lineHeight={18} color={c.muted}>
            {`⁦${Math.round(job.progress * 100)}%⁩`}
          </AppText>
        </View>
        <Progress value={job.progress} />
        <AppText size={12} lineHeight={17} color={c.muted}>
          {L('أبقِ التطبيق مفتوحًا حتى ينتهي التنفيذ.', 'Keep the app open until the run finishes.')}
        </AppText>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  mine: { alignSelf: 'flex-end', alignItems: 'flex-end', maxWidth: '86%', gap: 4 },
  mineLabel: { paddingHorizontal: 4 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.tier, borderBottomEndRadius: 4 },
  theirs: { alignSelf: 'flex-start', maxWidth: '86%', borderWidth: 1, borderBottomEndRadius: radius.tier, borderBottomStartRadius: 4 },
  quote: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  quoteRow: { flexDirection: 'row', marginTop: 4 },
  result: { gap: 8 },
  resultHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  running: { gap: 10, paddingVertical: 14 },
});
