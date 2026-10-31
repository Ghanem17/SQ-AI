import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ComingSoon } from '@/components/ComingSoon';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { ar } from '@/i18n/ar';
import { useTheme } from '@/theme/theme';

export default function AssistantScreen() {
  const { c } = useTheme();
  return (
    <View style={styles.fill}>
      <ComingSoon section="assistant" icon="chat" inTabs={false} />
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={ar.common.back}
        onPress={() => router.back()}
        style={[styles.close, { backgroundColor: c.tile }]}>
        <Icon name="close" color={c.text} size={20} strokeWidth={2} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, direction: 'rtl' },
  close: { position: 'absolute', top: 16, end: 16, width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
