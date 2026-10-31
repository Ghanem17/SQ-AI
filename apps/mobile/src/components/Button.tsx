import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { useTheme } from '@/theme/theme';

type Variant = 'primary' | 'secondary' | 'hero' | 'outline';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  height?: number;
  accessibilityHint?: string;
  // For surfaces with their own brand colors, such as the onboarding slides.
  colors?: { bg: string; fg: string };
};

export function Button({ label, onPress, variant = 'primary', icon, disabled, loading, style, height = 56, accessibilityHint, colors: custom }: Props) {
  const { c } = useTheme();
  const colors: Record<Variant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: c.primary, fg: c.onPrimary },
    secondary: { bg: c.tile, fg: c.text },
    hero: { bg: c.heroBtn, fg: c.heroBtnText },
    outline: { bg: 'transparent', fg: c.primary, border: c.primary },
  };
  const { bg, fg, border }: { bg: string; fg: string; border?: string } = custom ?? colors[variant];
  const inactive = disabled || loading;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={[
        styles.base,
        { height, backgroundColor: bg, opacity: disabled ? 0.45 : 1 },
        border ? { borderWidth: 2, borderColor: border } : null,
        style,
      ]}>
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} color={fg} size={18} strokeWidth={2} /> : null}
        <AppText weight="semibold" size={16} color={fg}>
          {label}
        </AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.control + 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
