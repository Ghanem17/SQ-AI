import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatIQD, services, tierNames } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Badge, Card, ListRow, ScrollScreen, TopBar } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useServices } from '@/features/services/store';
import { useTheme } from '@/theme/theme';

const statusLabel = {
  pending: { ar: 'بالانتظار', en: 'Waiting' },
  running: { ar: 'قيد التنفيذ', en: 'Running' },
  done: { ar: 'جاهز', en: 'Ready' },
  failed: { ar: 'متوقف', en: 'Stopped' },
} as const;
const statusTone = { pending: 'neutral', running: 'pri', done: 'ok', failed: 'bad' } as const;

export default function JobsScreen() {
  const { c } = useTheme();
  const { L, pick } = useI18n();
  const { jobs } = useServices();
  return (
    <ScrollScreen
      header={<TopBar title={L('طلبات الخدمات', 'Service orders')} />}
      footer={<Button label={L('طلب جديد', 'New order')} icon="plus" onPress={() => router.push('/order')} />}>
      {jobs.length === 0 ? (
        <Card style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: c.tile }]}>
            <Icon name="layers" color={c.muted} size={22} />
          </View>
          <AppText weight="semibold" size={15} center>
            {L('لا توجد طلبات بعد', 'No orders yet')}
          </AppText>
          <AppText size={13} color={c.muted} center>
            {L(
              'اطلب مونتاج فيديو، أو إعلانًا من صورة، أو فيديو من نص، أو نصًا، أو تعليقًا صوتيًا.',
              'Order a video edit, an ad from a photo, a video from text, copy, or a voice-over.',
            )}
          </AppText>
        </Card>
      ) : (
        <Card style={styles.list}>
          {jobs.map((j, i) => (
            <ListRow
              key={j.id}
              icon={j.kind === 'copy' ? 'edit' : j.kind === 'voice' ? 'mic' : j.kind === 'adImage' ? 'camera' : 'video'}
              title={j.title}
              subtitle={`${pick(services[j.kind].name)} · ${j.tier ? `${pick(tierNames[j.tier])} · ` : ''}${formatIQD(j.quote.totalIqd)}`}
              trailing={<Badge label={pick(statusLabel[j.status])} tone={statusTone[j.status]} />}
              onPress={() => router.push({ pathname: '/job/[id]', params: { id: j.id } })}
              last={i === jobs.length - 1}
            />
          ))}
        </Card>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: 2, gap: 0 },
  empty: { alignItems: 'center', paddingVertical: 26, gap: 8 },
  emptyIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
