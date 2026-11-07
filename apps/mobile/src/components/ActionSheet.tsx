import { router, type Href } from 'expo-router';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { IconBadge } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';

// The centre action's sheet: the two things the app is for, filming a reel
// and ordering a service, plus asking the assistant for an idea.
export function ActionSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { c } = useTheme();
  const { L, rtl, t } = useI18n();
  const insets = useSafeAreaInsets();
  const items: { icon: IconName; title: string; body: string; href: Href; solid?: boolean }[] = [
    {
      icon: 'camera',
      title: L('صوّر ريلًا', 'Shoot a reel'),
      body: L('قائمة لقطات ترشدك لقطةً بلقطة', 'A shot list that guides you shot by shot'),
      href: '/camera',
      solid: true,
    },
    {
      icon: 'sparkle',
      title: L('اطلب خدمة', 'Order a service'),
      body: L('مونتاج أو تصميم أو فيديو أو نص أو صوت', 'Editing, design, video, copy or voice'),
      href: '/order',
    },
    {
      icon: 'bulb',
      title: L('اقترح فكرة', 'Suggest an idea'),
      body: L('يقترح المساعد ثلاث أفكار تناسب نشاطك', 'The assistant suggests three ideas for you'),
      href: '/assistant',
    },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel={t.common.close} style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { direction: rtl ? 'rtl' : 'ltr', backgroundColor: c.card, borderColor: c.line, paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.handle, { backgroundColor: c.track }]} />
        <View style={styles.head}>
          <AppText variant="h3" style={styles.flex}>
            {L('ماذا تريد أن تفعل؟', 'What would you like to do?')}
          </AppText>
          <PressableScale accessibilityRole="button" accessibilityLabel={t.common.close} onPress={onClose} style={[styles.close, { borderColor: c.line }]}>
            <Icon name="close" color={c.text} size={18} />
          </PressableScale>
        </View>
        {items.map((it, i) => (
          <PressableScale
            key={it.title}
            accessibilityRole="button"
            accessibilityLabel={it.title}
            pressedScale={0.99}
            onPress={() => {
              onClose();
              router.push(it.href);
            }}
            style={[styles.row, i < items.length - 1 && { borderBottomColor: c.line, borderBottomWidth: 1 }]}>
            <IconBadge icon={it.icon} tone={it.solid ? 'solid' : 'pri'} size={44} />
            <View style={styles.flex}>
              <AppText variant="rowTitle">{it.title}</AppText>
              <AppText variant="small" color={c.muted} numberOfLines={1}>
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
