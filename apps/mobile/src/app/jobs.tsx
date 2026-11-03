import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatIQD, services } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Badge, Card, ListRow, ScrollScreen, TopBar } from '@/components/ui';
import { useServices } from '@/features/services/store';
import { useTheme } from '@/theme/theme';

const statusLabel = { pending: 'بالانتظار', running: 'قيد التنفيذ', done: 'جاهز', failed: 'متوقف' } as const;
const statusTone = { pending: 'neutral', running: 'pri', done: 'ok', failed: 'bad' } as const;

export default function JobsScreen() {
  const { c } = useTheme();
  const { jobs } = useServices();
  return (
    <ScrollScreen header={<TopBar title="طلبات الخدمات" />} footer={<Button label="طلب جديد" icon="plus" onPress={() => router.push('/order')} />}>
      {jobs.length === 0 ? (
        <Card style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: c.tile }]}>
            <Icon name="layers" color={c.muted} size={22} />
          </View>
          <AppText weight="semibold" size={15} center>
            لا توجد طلبات بعد
          </AppText>
          <AppText size={13} color={c.muted} center>
            اطلب مونتاج فيديو، إعلانًا من صورة، فيديو من نص، نصًا أو تعليقًا صوتيًا.
          </AppText>
        </Card>
      ) : (
        <Card style={styles.list}>
          {jobs.map((j, i) => (
            <ListRow
              key={j.id}
              icon={j.kind === 'copy' ? 'edit' : j.kind === 'voice' ? 'mic' : j.kind === 'adImage' ? 'camera' : 'video'}
              title={j.title}
              subtitle={`${services[j.kind].name} · ${formatIQD(j.quote.totalIqd)}`}
              trailing={<Badge label={statusLabel[j.status]} tone={statusTone[j.status]} />}
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
