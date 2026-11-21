// Where an attachment comes from: the gallery, or the phone's files at the
// original quality (nothing is compressed on the way).

import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_REFERENCE_IMAGES, MAX_UPLOAD_BYTES, formatNumber, radius } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { IconBadge } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';
import type { PickSource } from './media';

export function SourceSheet({
  kind,
  max = 1,
  onPick,
  onClose,
}: {
  // The sheet is open while a kind is set.
  kind: 'video' | 'image' | null;
  max?: number;
  onPick: (source: PickSource) => void;
  onClose: () => void;
}) {
  const { c } = useTheme();
  const { L, n, rtl, t } = useI18n();
  const insets = useSafeAreaInsets();
  const mb = formatNumber(MAX_UPLOAD_BYTES / 1_000_000);
  const video = kind === 'video';
  const many = !video && max > 1;
  const items: { source: PickSource; icon: IconName; title: string; body: string; solid?: boolean }[] = [
    {
      source: 'gallery',
      icon: video ? 'video' : 'image',
      title: L('من المعرض', 'From the gallery'),
      body: video
        ? L('فيديو حتى 3 دقائق دون ضغط', 'A video up to 3 minutes, not compressed')
        : many
          ? L(`حتى ${n(Math.min(max, MAX_REFERENCE_IMAGES), 'photo')} بأعلى جودة`, `Up to ${n(Math.min(max, MAX_REFERENCE_IMAGES), 'photo')} at full quality`)
          : L('صورة بأعلى جودة', 'A photo at full quality'),
      solid: true,
    },
    {
      source: 'files',
      icon: 'doc',
      title: L('من الملفات · بالدقة الأصلية', 'From files · original quality'),
      body: L(`الملف كما هو تمامًا، حتى ${mb} ميغابايت`, `The file exactly as it is, up to ${mb} MB`),
    },
  ];
  return (
    <Modal visible={kind !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel={t.common.close} style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { direction: rtl ? 'rtl' : 'ltr', backgroundColor: c.card, borderColor: c.line, paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.handle, { backgroundColor: c.track }]} />
        <View style={styles.head}>
          <AppText variant="h3" style={styles.flex}>
            {video ? L('أرفق الفيديو', 'Attach the video') : many ? L('أرفق الصور', 'Attach the photos') : L('أرفق الصورة', 'Attach the photo')}
          </AppText>
          <PressableScale accessibilityRole="button" accessibilityLabel={t.common.close} onPress={onClose} style={[styles.close, { borderColor: c.line }]}>
            <Icon name="close" color={c.text} size={18} />
          </PressableScale>
        </View>
        {items.map((it, i) => (
          <PressableScale
            key={it.source}
            accessibilityRole="button"
            accessibilityLabel={`${it.title}، ${it.body}`}
            pressedScale={0.99}
            onPress={() => onPick(it.source)}
            style={[styles.row, i < items.length - 1 && { borderBottomColor: c.line, borderBottomWidth: 1 }]}>
            <IconBadge icon={it.icon} tone={it.solid ? 'solid' : 'pri'} size={44} />
            <View style={styles.flex}>
              <AppText variant="rowTitle">{it.title}</AppText>
              <AppText variant="small" color={c.muted} numberOfLines={2}>
                {it.body}
              </AppText>
            </View>
            <Icon name="chevronLeft" color={c.placeholder} size={16} strokeWidth={1.8} />
          </PressableScale>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(11,19,43,0.45)' },
  sheet: { borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, borderWidth: 1, borderBottomWidth: 0, paddingHorizontal: 20, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  close: { width: 36, height: 36, borderRadius: radius.chip, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, paddingVertical: 12 },
  flex: { flex: 1 },
});
