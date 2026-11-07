import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { useTheme } from '@/theme/theme';

type Variant = 'primary' | 'secondary' | 'hero' | 'outline' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  // 36-high compact button for rows and empty states.
  small?: boolean;
  icon?: IconName;
  // Puts the icon after the label, e.g. a forward arrow.
  iconEnd?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  height?: number;
  accessibilityHint?: string;
  // For surfaces with their own brand colors, such as the hero.
  colors?: { bg: string; fg: string; border?: string };
};

// One control shape: radius 12, flat, no shadow. Pressed buttons dip to 98%.
export function Button({ label, onPress, variant = 'primary', small, icon, iconEnd, disabled, loading, style, height, accessibilityHint, colors: custom }: Props) {
  const { c } = useTheme();
  const colors: Record<Variant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: c.primary, fg: c.onPrimary },
    secondary: { bg: c.card, fg: c.text, border: c.lineStrong },
    hero: { bg: c.heroBtn, fg: c.heroBtnText },
    outline: { bg: 'transparent', fg: c.text, border: c.lineStrong },
    ghost: { bg: 'transparent', fg: c.text },
    danger: { bg: 'transparent', fg: c.bad, border: c.line },
  };
  const { bg, fg, border } = custom ?? colors[variant];
  const inactive = disabled || loading;
  const h = height ?? (small ? 36 : variant === 'ghost' ? 44 : variant === 'danger' ? 46 : 52);
  const glyph = loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} color={fg} size={small ? 16 : 18} strokeWidth={1.8} /> : null;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      pressedScale={0.98}
      style={[
        styles.base,
        small && styles.small,
        { height: h, backgroundColor: bg, opacity: disabled ? 0.4 : 1 },
        border ? { borderWidth: 1, borderColor: border } : null,
        style,
      ]}>
      <View style={styles.row}>
        {!iconEnd && glyph}
        <AppText weight="semibold" size={small ? 13 : variant === 'danger' ? 14 : 15} lineHeight={20} color={fg} numberOfLines={1}>
          {label}
        </AppText>
        {iconEnd && glyph}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  small: { borderRadius: radius.chip, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
