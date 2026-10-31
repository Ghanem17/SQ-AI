import { useEffect, type RefObject } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputInstance } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { OTP_LENGTH, radius, sanitizeOtp } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { ar } from '@/i18n/ar';
import { useTheme } from '@/theme/theme';

export type OtpState = 'idle' | 'checking' | 'wrong' | 'ok';

type Props = {
  value: string;
  onChange: (code: string) => void;
  state: OtpState;
  shakeKey: number;
  inputRef: RefObject<TextInputInstance | null>;
};

// Six boxes over one real text field, so paste, autofill and the system
// keyboard work normally. Digits read left to right, like the code itself.
export function OtpInput({ value, onChange, state, shakeKey, inputRef }: Props) {
  const { c } = useTheme();
  const reduceMotion = useReducedMotion();
  const shake = useSharedValue(0);

  useEffect(() => {
    if (shakeKey === 0 || reduceMotion) return;
    shake.set(
      withSequence(
        withTiming(-12, { duration: 50 }),
        withTiming(12, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      ),
    );
  }, [shakeKey, reduceMotion, shake]);

  const row = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  return (
    <Pressable accessibilityLabel={ar.verify.codeLabel} onPress={() => inputRef.current?.focus()}>
      <Animated.View style={[styles.row, row]}>
        {Array.from({ length: OTP_LENGTH }, (_, i) => (
          <Box key={i} char={value[i]} active={i === value.length && state === 'idle'} state={state} />
        ))}
      </Animated.View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(sanitizeOtp(text))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={OTP_LENGTH + 40}
        autoFocus
        editable={state !== 'checking' && state !== 'ok'}
        accessibilityLabel={ar.verify.codeLabel}
        caretHidden
        style={[StyleSheet.absoluteFill, styles.hidden, { color: c.text }]}
      />
    </Pressable>
  );
}

function Box({ char, active, state }: { char: string | undefined; active: boolean; state: OtpState }) {
  const { c } = useTheme();
  const reduceMotion = useReducedMotion();
  const pop = useSharedValue(1);

  useEffect(() => {
    if (char && !reduceMotion) {
      pop.set(withSequence(withTiming(1.12, { duration: 90 }), withSpring(1, { damping: 10, stiffness: 260 })));
    }
  }, [char, reduceMotion, pop]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  const border = state === 'ok' ? c.ok : state === 'wrong' ? c.bad : active ? c.primary : c.tile;
  const background = state === 'ok' ? c.okSoft : state === 'wrong' ? c.badSoft : c.tile;

  return (
    <Animated.View style={[styles.box, { borderColor: border, backgroundColor: background }, style]}>
      {state === 'ok' ? (
        <Icon name="check" color={c.ok} size={20} strokeWidth={3} />
      ) : (
        <AppText weight="bold" size={24} lineHeight={30} color={state === 'wrong' ? c.bad : c.text}>
          {char ?? ''}
        </AppText>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center', direction: 'ltr' },
  box: { width: 48, height: 58, borderRadius: radius.control, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  hidden: { opacity: 0.02 },
});
