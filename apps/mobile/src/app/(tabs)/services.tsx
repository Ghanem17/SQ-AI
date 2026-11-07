import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { formatIQD, serviceModels, serviceOrder, services, startingPrice, type ServiceKind } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { Chip, Field, IconBadge, IconButton, ListCard, Note, PageTitle, ScrollScreen, SectionTitle } from '@/components/ui';
import { OrderRow, serviceIcons } from '@/features/services/OrderRow';
import { useServices } from '@/features/services/store';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';

type Filter = 'all' | 'video' | 'design' | 'writing' | 'voice';

const groups: Record<Exclude<Filter, 'all'>, ServiceKind[]> = {
  video: ['editVideo', 'textVideo'],
  design: ['adImage'],
  writing: ['copy'],
  voice: ['voice'],
};

// The five one-off services. Each has three levels; tapping one opens the
// order desk for it.
export default function ServicesTab() {
  const { c } = useTheme();
  const { L, pick, rtl } = useI18n();
  const { jobs, settings } = useServices();
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
  const from = formatIQD(startingPrice(settings));

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
      <Note tone="info" icon="layers">
        {L('لكل خدمة ثلاثة مستويات: ', 'Every service has three levels: ')}
        <AppText weight="bold" size={12.5} lineHeight={19} color={c.onPriSoft}>
          {L('منخفض · متوسط · عالٍ', 'Low · Medium · High')}
        </AppText>
        {L('، وترى النماذج والسعر قبل التأكيد.', ', and you see the models and price before you confirm.')}
      </Note>

      {shown.length === 0 ? (
        <Note>{L('لا توجد خدمة بهذا الاسم. جرّب كلمة أخرى.', 'No service matches. Try another word.')}</Note>
      ) : (
        <ListCard>
          {shown.map((k, i) => (
            <PressableScale
              key={k}
              accessibilityRole="button"
              accessibilityLabel={`${pick(services[k].name)}، ${L(`من ${from}`, `from ${from}`)}`}
              onPress={() => router.push({ pathname: '/order', params: { service: k } })}
              pressedScale={1}
              style={[styles.row, i < shown.length - 1 && { borderBottomColor: c.line, borderBottomWidth: 1 }]}>
              <IconBadge icon={serviceIcons[k]} size={44} />
              <View style={styles.flex}>
                <View style={styles.titleRow}>
                  <AppText variant="rowTitle" style={styles.flex} numberOfLines={1}>
                    {pick(services[k].name)}
                  </AppText>
                  <AppText weight="semibold" size={12.5} lineHeight={18}>
                    {L(`من ${from}`, `from ${from}`)}
                  </AppText>
                </View>
                <AppText variant="small" color={c.muted} numberOfLines={1}>
                  {pick(services[k].pitch)}
                </AppText>
                <AppText weight="medium" size={11} lineHeight={16} color={c.placeholder} numberOfLines={1} style={[styles.models, { textAlign: rtl ? 'right' : 'left' }]}>
                  {serviceModels[k]}
                </AppText>
              </View>
            </PressableScale>
          ))}
        </ListCard>
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
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  models: { marginTop: 4, writingDirection: 'ltr' },
});
