import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
  pressedScale?: number;
};

export function tapHaptic() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

// A pressable that dips slightly while held. Short and linear, no bounce, so
// the app feels precise rather than playful.
export function PressableScale({
  style,
  haptic = true,
  pressedScale = 0.985,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  accessibilityState,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const dim = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  // The animated opacity would override a style's own opacity, so the press
  // dim multiplies it; a disabled control renders at 40% (spec §5).
  const flat = StyleSheet.flatten(style);
  const base = disabled ? Math.min(typeof flat?.opacity === 'number' ? flat.opacity : 1, 0.4) : typeof flat?.opacity === 'number' ? flat.opacity : 1;
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }], opacity: dim.get() * base }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityState={{ ...accessibilityState, disabled: !!disabled }}
      onPressIn={(e) => {
        if (!reduceMotion) scale.set(withTiming(pressedScale, { duration: 90 }));
        dim.set(withTiming(0.86, { duration: 90 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withTiming(1, { duration: 140 }));
        dim.set(withTiming(1, { duration: 140 }));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) tapHaptic();
        onPress?.(e);
      }}
      style={[style, animated]}
    />
  );
}
