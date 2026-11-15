// Illustrative examples of what each service delivers: a before → after
// cover per service, drawn for this app in the brand colors (no AI output).
// The food photo in them is the public-domain "Cheeseburger" photo by the
// US National Cancer Institute (Wikimedia Commons). Covers with text come
// in Arabic and English; the "illustrative example" label is drawn here so
// nobody mistakes a cover for a real result.

import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { formatIQD, radius, serviceOrder, services, startingPrice, type ServiceKind } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { GUTTER } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';
import { useServices } from './store';

const covers: Record<ServiceKind, { ar: number; en: number }> = {
  editVideo: { ar: require('../../../assets/examples/editVideo-ar.webp'), en: require('../../../assets/examples/editVideo-en.webp') },
  imageVideo: { ar: require('../../../assets/examples/imageVideo-ar.webp'), en: require('../../../assets/examples/imageVideo-en.webp') },
  adImage: { ar: require('../../../assets/examples/adImage-ar.webp'), en: require('../../../assets/examples/adImage-en.webp') },
  textVideo: { ar: require('../../../assets/examples/textVideo-ar.webp'), en: require('../../../assets/examples/textVideo-en.webp') },
  copy: { ar: require('../../../assets/examples/copy-ar.webp'), en: require('../../../assets/examples/copy-en.webp') },
  voice: { ar: require('../../../assets/examples/voice-ar.webp'), en: require('../../../assets/examples/voice-en.webp') },
};

// The covers are 720×400.
export const COVER_RATIO = 1.8;

// What the cover shows, for screen readers.
const coverText: Record<ServiceKind, { ar: string; en: string }> = {
  editVideo: { ar: 'مقطع خام يتحول إلى فيديو مرتب بنص مكتوب وموسيقى', en: 'A raw clip becomes a tidy video with captions and music' },
  imageVideo: { ar: 'ثلاث صور لمنتج تتحول إلى فيديو عمودي متحرك', en: 'Three product photos become a moving vertical video' },
  adImage: { ar: 'صورة منتج عادية تتحول إلى إعلان بعنوان وسعر', en: 'A plain product photo becomes an ad with a headline and price' },
  textVideo: { ar: 'وصف مكتوب يتحول إلى لقطة سينمائية', en: 'A written description becomes a cinematic shot' },
  copy: { ar: 'فكرة منشور تتحول إلى منشور جاهز للنشر', en: 'A post idea becomes a ready-to-publish post' },
  voice: { ar: 'نص مكتوب يتحول إلى تعليق صوتي', en: 'A written script becomes a voice-over' },
};

export function exampleSource(kind: ServiceKind, lang: 'ar' | 'en'): number {
  return covers[kind][lang];
}

// The small label on every cover.
export function ExampleChip({ style }: { style?: StyleProp<ViewStyle> }) {
  const { L } = useI18n();
  return (
    <View style={[styles.chip, style]}>
      <AppText weight="medium" size={10.5} lineHeight={15} color="#F5F2EC">
        {L('مثال توضيحي', 'Illustrative example')}
      </AppText>
    </View>
  );
}

// A service's cover with its label, at the full width it is given.
export function ExampleCover({ kind, style, rounded = true }: { kind: ServiceKind; style?: StyleProp<ViewStyle>; rounded?: boolean }) {
  const { c } = useTheme();
  const { lang, pick, rtl } = useI18n();
  return (
    <View style={[styles.cover, rounded && styles.coverRounded, { backgroundColor: c.hero }, style]}>
      <Image
        source={covers[kind][lang]}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={120}
        accessible
        accessibilityLabel={pick(coverText[kind])}
      />
      {/* Over the "before" side, at the reading start. */}
      <ExampleChip style={[styles.chipAt, rtl ? styles.right : styles.left]} />
    </View>
  );
}

// The services tab's card: the cover, then the name, pitch, starting price
// and the three levels.
export function ServiceCard({ kind, onPress }: { kind: ServiceKind; onPress: () => void }) {
  const { c, elev } = useTheme();
  const { L, pick } = useI18n();
  const { settings } = useServices();
  const from = formatIQD(startingPrice(settings));
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${pick(services[kind].name)}، ${L(`من ${from}`, `from ${from}`)}`}
      onPress={onPress}
      pressedScale={0.99}
      style={[styles.card, { backgroundColor: c.card, borderColor: c.line }, elev.card]}>
      <ExampleCover kind={kind} rounded={false} />
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <AppText variant="rowTitle" style={styles.flex} numberOfLines={1}>
            {pick(services[kind].name)}
          </AppText>
          <AppText weight="semibold" size={13} lineHeight={19}>
            {L(`من ${from}`, `from ${from}`)}
          </AppText>
        </View>
        <AppText variant="small" color={c.muted} numberOfLines={1}>
          {pick(services[kind].pitch)}
        </AppText>
        <View style={styles.metaRow}>
          <View style={[styles.levels, { backgroundColor: c.priSoft }]}>
            <Icon name="layers" color={c.onPriSoft} size={13} />
            <AppText weight="medium" size={11.5} lineHeight={16} color={c.onPriSoft}>
              {L('3 مستويات', '3 levels')}
            </AppText>
          </View>
          <View style={styles.flex} />
          <AppText weight="semibold" size={12.5} lineHeight={18} color={c.text}>
            {L('اطلب', 'Order')}
          </AppText>
          <Icon name="chevronLeft" color={c.text} size={14} strokeWidth={2} />
        </View>
      </View>
    </PressableScale>
  );
}

// The compact version for the order form and the quote: a small cover with
// the label and the service's pitch.
export function ExampleStrip({ kind }: { kind: ServiceKind }) {
  const { c, elev } = useTheme();
  const { lang, pick } = useI18n();
  return (
    <View style={[styles.strip, { backgroundColor: c.card, borderColor: c.line }, elev.card]}>
      <View style={[styles.stripCover, { backgroundColor: c.hero }]}>
        <Image source={covers[kind][lang]} style={StyleSheet.absoluteFill} contentFit="cover" accessible accessibilityLabel={pick(coverText[kind])} />
      </View>
      <View style={styles.stripText}>
        <ExampleChip style={{ backgroundColor: c.hero }} />
        <AppText size={12.5} lineHeight={19} color={c.muted} numberOfLines={3}>
          {pick(coverText[kind])}
        </AppText>
      </View>
    </View>
  );
}

// A row of small example cards that bleeds to the screen edges, used on an
// empty Home as "try your first service".
export function ExampleRow() {
  const { c, elev } = useTheme();
  const { L, pick } = useI18n();
  const { settings } = useServices();
  const from = formatIQD(startingPrice(settings));
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll} contentContainerStyle={styles.row}>
      {serviceOrder.map((k) => (
        <PressableScale
          key={k}
          accessibilityRole="button"
          accessibilityLabel={`${pick(services[k].name)}، ${L(`من ${from}`, `from ${from}`)}`}
          onPress={() => router.push({ pathname: '/order', params: { service: k } })}
          pressedScale={0.98}
          style={[styles.mini, { backgroundColor: c.card, borderColor: c.line }, elev.card]}>
          <ExampleCover kind={k} rounded={false} />
          <View style={styles.miniBody}>
            <AppText weight="semibold" size={13.5} lineHeight={20} numberOfLines={1}>
              {pick(services[k].name)}
            </AppText>
            <AppText size={12} lineHeight={17} color={c.muted} numberOfLines={1}>
              {L(`من ${from} · 3 مستويات`, `from ${from} · 3 levels`)}
            </AppText>
          </View>
        </PressableScale>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  cover: { width: '100%', aspectRatio: COVER_RATIO, overflow: 'hidden' },
  coverRounded: { borderRadius: radius.control },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.badge, backgroundColor: 'rgba(11,19,43,0.72)', borderWidth: 1, borderColor: 'rgba(244,214,176,0.35)' },
  chipAt: { position: 'absolute', top: 8 },
  left: { left: 8 },
  right: { right: 8 },
  card: { borderRadius: radius.card, borderWidth: 1, overflow: 'hidden' },
  cardBody: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  levels: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, height: 22, borderRadius: radius.badge },
  strip: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.card, borderWidth: 1, padding: 8, paddingEnd: 12 },
  stripCover: { width: 132, aspectRatio: COVER_RATIO, borderRadius: 10, overflow: 'hidden' },
  stripText: { flex: 1, gap: 6 },
  rowScroll: { marginHorizontal: -GUTTER, flexGrow: 0 },
  row: { gap: 10, paddingHorizontal: GUTTER, paddingBottom: 4 },
  mini: { width: 220, borderRadius: radius.card, borderWidth: 1, overflow: 'hidden' },
  miniBody: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10 },
});
