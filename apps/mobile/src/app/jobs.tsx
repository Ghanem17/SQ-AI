import { router } from 'expo-router';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { formatIQD, formatNumber } from '@sq/shared';
import { Button } from '@/components/Button';
import { Card, EmptyState, GUTTER, KeyValue, ScrollScreen, TopBar } from '@/components/ui';
import { ResultTile } from '@/features/services/ResultTile';
import { useServices } from '@/features/services/store';
import { useI18n } from '@/i18n';

const GAP = 12;

// Every service order placed on this device, newest first, as a grid of
// results. Orders still running or stopped carry their status on the tile.
export default function JobsScreen() {
  const { L } = useI18n();
  const { jobs } = useServices();
  const { width } = useWindowDimensions();
  const tile = Math.floor((Math.min(width, 520) - GUTTER * 2 - GAP) / 2);
  const total = jobs.reduce((s, j) => s + j.quote.totalIqd, 0);
  return (
    <ScrollScreen
      header={<TopBar title={L('نتائجك وطلباتك', 'Your results and orders')} />}
      footer={<Button label={L('طلب جديد', 'New order')} icon="plus" onPress={() => router.navigate('/services')} />}>
      {jobs.length === 0 ? (
        <EmptyState
          icon="layers"
          title={L('لا توجد طلبات بعد', 'No orders yet')}
          body={L(
            'اطلب مونتاج فيديو، أو فيديو من صورك، أو إعلانًا من صورة، أو فيديو من نص، أو نصًا، أو تعليقًا صوتيًا. تظهر نتائجك هنا.',
            'Order a video edit, a video from your photos, an ad from a photo, a video from text, copy, or a voice-over. Your results show here.',
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
          <View style={styles.grid}>
            {jobs.map((j) => (
              <ResultTile key={j.id} job={j} width={tile} />
            ))}
          </View>
        </>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  total: { paddingVertical: 6, gap: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
});
