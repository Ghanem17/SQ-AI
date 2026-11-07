import { useEffect, type RefObject } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { OTP_LENGTH, radius, sanitizeOtp } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';

export type OtpState = 'idle' | 'checking' | 'wrong' | 'ok';

type Props = {
  value: string;
  onChange: (code: string) => void;
  state: OtpState;
  shakeKey: number;
  inputRef: RefObject<TextInputInstance | null>;
  autoFocus?: boolean;
};

// Six boxes over one real text field, so paste, autofill and the system
// keyboard work normally. Digits read left to right, like the code itself.
export function OtpInput({ value, onChange, state, shakeKey, inputRef, autoFocus = true }: Props) {
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

  const codeLabel = useI18n().t.verify.codeLabel;
  const row = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  return (
    <Pressable accessibilityLabel={codeLabel} onPress={() => inputRef.current?.focus()}>
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
        autoFocus={autoFocus}
        editable={state !== 'checking' && state !== 'ok'}
        accessibilityLabel={codeLabel}
        caretHidden
        style={[styles.overlay, styles.hidden, { color: c.text }]}
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
      pop.set(withSequence(withTiming(1.06, { duration: 80 }), withTiming(1, { duration: 120 })));
    }
  }, [char, reduceMotion, pop]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  const border = state === 'ok' ? c.ok : state === 'wrong' ? c.bad : active ? c.primary : c.line;
  const background = state === 'ok' ? c.okSoft : state === 'wrong' ? c.badSoft : c.card;
  const strong = active || state === 'ok' || state === 'wrong';

  return (
    <Animated.View style={[styles.box, { borderColor: border, borderWidth: strong ? 1.5 : 1, backgroundColor: background }, style]}>
      {state === 'ok' ? (
        <Icon name="check" color={c.ok} size={20} strokeWidth={2.4} />
      ) : char ? (
        <AppText weight="semibold" size={22} lineHeight={28} color={state === 'wrong' ? c.bad : c.text}>
          {char}
        </AppText>
      ) : active ? (
        <View style={[styles.caret, { backgroundColor: c.primary }]} />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, direction: 'ltr' },
  box: { flex: 1, height: 54, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  caret: { width: 1.5, height: 22 },
  hidden: { opacity: 0.02 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
