import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { serviceModels, serviceOrder, services, type ServiceKind } from '@sq/shared';
import { Chip, Field, IconButton, ListCard, Note, PageTitle, ScrollScreen, SectionTitle } from '@/components/ui';
import { ServiceCard } from '@/features/services/examples';
import { OrderRow } from '@/features/services/OrderRow';
import { useServices } from '@/features/services/store';
import { useI18n } from '@/i18n';

type Filter = 'all' | 'video' | 'design' | 'writing' | 'voice';

const groups: Record<Exclude<Filter, 'all'>, ServiceKind[]> = {
  video: ['editVideo', 'imageVideo', 'textVideo'],
  design: ['adImage'],
  writing: ['copy'],
  voice: ['voice'],
};

// The one-off services as visual cards: an illustrative example of what each
// delivers, its price from, and its three levels. Tapping one opens the quick
// order form for it.
export default function ServicesTab() {
  const { L } = useI18n();
  const { jobs } = useServices();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [showFilters, setShowFilters] = useState(true);
  const busy = jobs.some((j) => j.status === 'running' || j.status === 'pending');

  const q = query.trim().toLowerCase();
  const shown = serviceOrder.filter(
    (k) =>
      (filter === 'all' || groups[filter].includes(k)) &&
      (!q || [services[k].name.ar, services[k].name.en, services[k].pitch.ar, services[k].pitch.en, serviceModels[k]].some((s) => s.toLowerCase().includes(q))),
  );
  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: L('الكل', 'All') },
    { value: 'video', label: L('فيديو', 'Video') },
    { value: 'design', label: L('تصميم', 'Design') },
    { value: 'writing', label: L('كتابة', 'Writing') },
    { value: 'voice', label: L('صوت', 'Voice') },
  ];

  return (
    <ScrollScreen inTabs>
      <PageTitle
        title={L('الخدمات', 'Services')}
        subtitle={L('اطلب مرة واحدة، دون اشتراك', 'Order once, no subscription')}
        right={<IconButton icon="bell" label={L('طلباتك', 'Your orders')} dot={busy} onPress={() => router.push('/jobs')} />}
      />
      <View style={styles.searchRow}>
        <View style={styles.flex}>
          <Field
            icon="search"
            value={query}
            onChangeText={setQuery}
            placeholder={L('ابحث عن خدمة', 'Search services')}
            accessibilityLabel={L('ابحث عن خدمة', 'Search services')}
            returnKeyType="search"
            style={styles.search}
          />
        </View>
        <IconButton
          icon="sliders"
          size={46}
          label={showFilters ? L('إخفاء التصنيفات', 'Hide categories') : L('إظهار التصنيفات', 'Show categories')}
          onPress={() => setShowFilters((s) => !s)}
        />
      </View>
      {showFilters && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroll}>
          {filters.map((f) => (
            <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
          ))}
        </ScrollView>
      )}
      {shown.length === 0 ? (
        <Note>{L('لا توجد خدمة بهذا الاسم. جرّب كلمة أخرى.', 'No service matches. Try another word.')}</Note>
      ) : (
        <View style={styles.cards}>
          {shown.map((k) => (
            <ServiceCard key={k} kind={k} onPress={() => router.push({ pathname: '/order', params: { service: k } })} />
          ))}
        </View>
      )}

      {jobs.length > 0 && (
        <>
          <SectionTitle title={L('طلباتك', 'Your orders')} action={L(`عرض الكل (${jobs.length})`, `See all (${jobs.length})`)} onAction={() => router.push('/jobs')} />
          <ListCard>
            {jobs.slice(0, 3).map((j, i, arr) => (
              <OrderRow key={j.id} job={j} last={i === arr.length - 1} />
            ))}
          </ListCard>
        </>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  search: { height: 46 },
  chipScroll: { marginHorizontal: -20, flexGrow: 0 },
  chips: { gap: 8, paddingHorizontal: 20 },
  cards: { gap: 12 },
});
