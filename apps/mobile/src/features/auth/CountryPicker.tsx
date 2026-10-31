import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { countries, radius, type Country } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { ar } from '@/i18n/ar';
import { useTheme } from '@/theme/theme';

type Props = { visible: boolean; selected: Country; onSelect: (c: Country) => void; onClose: () => void };

export function CountryPicker({ visible, selected, onSelect, onClose }: Props) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel={ar.common.back} style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: c.bg, paddingBottom: insets.bottom + 12 }]}>
        <View style={[styles.handle, { backgroundColor: c.track }]} />
        <AppText weight="semibold" size={18} style={styles.title}>
          {ar.auth.chooseCountry}
        </AppText>
        <FlatList
          data={countries}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => {
            const active = item.code === selected.code;
            return (
              <PressableScale
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => onSelect(item)}
                style={[styles.row, { backgroundColor: active ? c.priSoft : c.tile }]}>
                <AppText weight="medium" size={15} color={active ? c.onPriSoft : c.text} style={styles.flex}>
                  {item.nameAr}
                </AppText>
                <AppText weight="semibold" size={15} color={active ? c.onPriSoft : c.muted} style={styles.ltr}>
                  {`+${item.dial}`}
                </AppText>
                {active && <Icon name="check" color={c.onPriSoft} size={16} strokeWidth={2.5} />}
              </PressableScale>
            );
          }}
          contentContainerStyle={styles.list}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(11,34,38,0.45)' },
  sheet: { borderTopStartRadius: radius.tile, borderTopEndRadius: radius.tile, paddingTop: 10, maxHeight: '70%', direction: 'rtl' },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, marginBottom: 12 },
  title: { paddingHorizontal: 20, marginBottom: 8 },
  list: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  row: { minHeight: 54, borderRadius: radius.control, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  ltr: { writingDirection: 'ltr' },
});
