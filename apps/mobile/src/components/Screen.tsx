import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
  background?: string;
};

// Every screen is laid out right-to-left, whatever the phone's language.
// Expo Go ignores the app's forced RTL, so the direction is also set here.
export function Screen({ children, style, edges = ['top'], background }: Props) {
  const { c } = useTheme();
  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: background ?? c.bg }]}>
      <View style={[styles.root, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, direction: 'rtl' },
});
