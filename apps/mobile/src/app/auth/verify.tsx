import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View, type TextInputInstance } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';

import { isCompleteOtp } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { DEMO_CODE, sendCode, verifyCode } from '@/features/auth/authService';
import { OtpInput, type OtpState } from '@/features/auth/OtpInput';
import { ar } from '@/i18n/ar';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/theme';

const t = ar.verify;
const RESEND_SECONDS = 30;

function notify(type: Haptics.NotificationFeedbackType) {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type).catch(() => undefined);
}

export default function VerifyScreen() {
  const { c } = useTheme();
  const reduceMotion = useReducedMotion();
  const { phone, display, mode, name } = useLocalSearchParams<{ phone: string; display: string; mode: string; name?: string }>();
  const { signIn, accountType } = useSession();
  const inputRef = useRef<TextInputInstance>(null);

  const [code, setCode] = useState('');
  const [state, setState] = useState<OtpState>('idle');
  const [shakeKey, setShakeKey] = useState(0);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const onChange = async (next: string) => {
    if (state === 'wrong') setState('idle');
    setCode(next);
    if (!isCompleteOtp(next)) return;

    setState('checking');
    const result = await verifyCode(phone, next);
    if (result === 'ok') {
      setState('ok');
      notify(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        signIn(phone, mode === 'signUp' && name ? name : null);
        router.replace(mode === 'signIn' && accountType ? '/(tabs)' : '/auth/account-type');
      }, reduceMotion ? 0 : 650);
    } else {
      setState('wrong');
      setShakeKey((k) => k + 1);
      notify(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => {
        setCode('');
        inputRef.current?.focus();
      }, 450);
    }
  };

  const resend = async () => {
    setSeconds(RESEND_SECONDS);
    setCode('');
    setState('idle');
    await sendCode(phone);
  };

  return (
    <Screen edges={['top', 'bottom']} style={styles.body}>
      <View style={styles.topRow}>
        <PressableScale accessibilityRole="button" accessibilityLabel={ar.common.back} onPress={() => router.back()} style={[styles.back, { borderColor: c.line }]}>
          <Icon name="back" color={c.text} size={20} strokeWidth={2} />
        </PressableScale>
      </View>

      <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(260)} style={styles.head}>
        <AppText weight="semibold" size={24} lineHeight={34}>
          {t.title}
        </AppText>
        <AppText size={15} lineHeight={25} color={c.muted}>
          {t.sentTo(display ?? phone)}
        </AppText>
      </Animated.View>

      <OtpInput inputRef={inputRef} value={code} onChange={onChange} state={state} shakeKey={shakeKey} />

      <View style={styles.status}>
        {state === 'wrong' && (
          <Animated.View entering={FadeIn}>
            <AppText size={14} color={c.bad} center accessibilityLiveRegion="assertive">
              {t.wrong}
            </AppText>
          </Animated.View>
        )}
        {state === 'ok' && (
          <Animated.View entering={FadeIn}>
            <AppText weight="semibold" size={15} color={c.ok} center accessibilityLiveRegion="polite">
              {t.verified}
            </AppText>
          </Animated.View>
        )}
      </View>

      <View style={[styles.demo, { backgroundColor: c.accSoft }]}>
        <AppText size={13} color={c.acc} center>
          {t.devHint(DEMO_CODE)}
        </AppText>
      </View>

      <View style={styles.links}>
        {seconds > 0 ? (
          <AppText size={14} color={c.muted}>
            {t.resendIn(seconds)}
          </AppText>
        ) : (
          <PressableScale accessibilityRole="button" onPress={resend} style={styles.link}>
            <AppText weight="semibold" size={14} color={c.primary}>
              {t.resend}
            </AppText>
          </PressableScale>
        )}
        <PressableScale accessibilityRole="button" onPress={() => router.back()} style={styles.link}>
          <AppText weight="semibold" size={14} color={c.primary}>
            {t.changeNumber}
          </AppText>
        </PressableScale>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 12, gap: 20 },
  topRow: { flexDirection: 'row' },
  back: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  head: { gap: 6 },
  status: { minHeight: 24 },
  demo: { alignSelf: 'center', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  links: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { minHeight: 44, justifyContent: 'center' },
});
