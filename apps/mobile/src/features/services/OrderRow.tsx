import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatIQD, formatTime, services, tierNames, type ServiceKind } from '@sq/shared';
import { AppText } from '@/components/AppText';
import type { IconName } from '@/components/Icon';
import { Badge, Chevron, IconBadge, type Tone } from '@/components/ui';
import { PressableScale } from '@/components/PressableScale';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';
import type { ServiceJob } from './store';

export const serviceIcons: Record<ServiceKind, IconName> = { editVideo: 'video', adImage: 'image', textVideo: 'film', copy: 'edit', voice: 'mic' };

export const jobStatus: Record<ServiceJob['status'], { label: { ar: string; en: string }; tone: Tone }> = {
  pending: { label: { ar: 'بالانتظار', en: 'Waiting' }, tone: 'neutral' },
  running: { label: { ar: 'قيد التنفيذ', en: 'In progress' }, tone: 'warn' },
  done: { label: { ar: 'جاهز', en: 'Ready' }, tone: 'ok' },
  failed: { label: { ar: 'متوقف', en: 'Stopped' }, tone: 'bad' },
};

// One service order in a statement-style list: the service, its level, id
// and time, then the status over the amount at the end.
export function OrderRow({ job, last }: { job: ServiceJob; last?: boolean }) {
  const { c } = useTheme();
  const { pick, L } = useI18n();
  const status = jobStatus[job.status];
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${job.title}، ${pick(status.label)}`}
      onPress={() => router.push({ pathname: '/job/[id]', params: { id: job.id } })}
      pressedScale={1}
      style={[styles.row, !last && { borderBottomColor: c.line, borderBottomWidth: 1 }]}>
      <IconBadge icon={serviceIcons[job.kind]} size={40} />
      <View style={styles.flex}>
        <AppText variant="rowTitle" numberOfLines={1}>
          {job.title || pick(services[job.kind].name)}
        </AppText>
        <AppText variant="small" color={c.muted} numberOfLines={1}>
          {`${pick(tierNames[job.tier])} · ⁦${job.id}⁩ · ⁦${formatTime(job.createdAt)}⁩`}
        </AppText>
      </View>
      <View style={styles.end}>
        <Badge label={pick(status.label)} tone={status.tone} style={styles.badgeEnd} />
        <AppText size={12.5} lineHeight={18} weight="semibold" accessibilityLabel={L(`المبلغ ${formatIQD(job.quote.totalIqd)}`, `Amount ${formatIQD(job.quote.totalIqd)}`)}>
          {formatIQD(job.quote.totalIqd)}
        </AppText>
      </View>
      <Chevron />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 12, paddingHorizontal: 14 },
  flex: { flex: 1 },
  end: { alignItems: 'flex-end', gap: 4 },
  badgeEnd: { alignSelf: 'flex-end' },
});
