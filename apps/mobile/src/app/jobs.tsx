import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { formatIQD, formatNumber } from '@sq/shared';
import { Button } from '@/components/Button';
import { EmptyState, KeyValue, Card, ListCard, ScrollScreen, TopBar } from '@/components/ui';
import { OrderRow } from '@/features/services/OrderRow';
import { useServices } from '@/features/services/store';
import { useI18n } from '@/i18n';

// Every service order placed on this device, newest first.
export default function JobsScreen() {
  const { L } = useI18n();
  const { jobs } = useServices();
  const total = jobs.reduce((s, j) => s + j.quote.totalIqd, 0);
  return (
    <ScrollScreen
      header={<TopBar title={L('طلبات الخدمات', 'Service orders')} />}
      footer={<Button label={L('طلب جديد', 'New order')} icon="plus" onPress={() => router.push('/order')} />}>
      {jobs.length === 0 ? (
        <EmptyState
          icon="layers"
          title={L('لا توجد طلبات بعد', 'No orders yet')}
          body={L(
            'اطلب مونتاج فيديو، أو إعلانًا من صورة، أو فيديو من نص، أو نصًا، أو تعليقًا صوتيًا.',
            'Order a video edit, an ad from a photo, a video from text, copy, or a voice-over.',
          )}
        />
      ) : (
        <>
          <Card style={styles.total}>
            <KeyValue
              icon="receipt"
              strong
              label={L('إجمالي طلباتك', 'All your orders')}
              sub={L(`عدد الطلبات: ${formatNumber(jobs.length)}`, `Orders: ${formatNumber(jobs.length)}`)}
              value={formatIQD(total)}
            />
          </Card>
          <ListCard>
            {jobs.map((j, i) => (
              <OrderRow key={j.id} job={j} last={i === jobs.length - 1} />
            ))}
          </ListCard>
        </>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  total: { paddingVertical: 6, gap: 0 },
});
