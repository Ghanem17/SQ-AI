import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
  background?: string;
};

// Screens follow the interface language: right to left for Arabic, left to
// right for English, whatever the phone's own language.
export function Screen({ children, style, edges = ['top'], background }: Props) {
  const { c } = useTheme();
  const { rtl } = useI18n();
  const direction = rtl ? 'rtl' : 'ltr';
  return (
    <SafeAreaView edges={edges} style={[styles.root, { direction, backgroundColor: background ?? c.bg }]}>
      <View style={[styles.root, { direction }, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
