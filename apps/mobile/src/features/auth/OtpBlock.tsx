import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View, type TextInputInstance } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';

import { isCompleteOtp } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PressableScale } from '@/components/PressableScale';
import { Badge, Note } from '@/components/ui';
import { DEMO_CODE, sendCode, verifyCode } from '@/features/auth/authService';
import { OtpInput, type OtpState } from '@/features/auth/OtpInput';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';

const RESEND_SECONDS = 30;

function notify(type: Haptics.NotificationFeedbackType) {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type).catch(() => undefined);
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// The WhatsApp code: six cells, a resend timer and "change number", then
// the confirm button. Shown inline on the sign-in screen once the code is
// sent, so the screen does not jump to another page.
export function OtpBlock({ phone, display, onVerified, onChangeNumber }: { phone: string; display: string; onVerified: () => void; onChangeNumber: () => void }) {
  const { c } = useTheme();
  const { t: all, L } = useI18n();
  const t = all.verify;
  const reduceMotion = useReducedMotion();
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

  const check = async (value: string) => {
    if (!isCompleteOtp(value) || state === 'checking' || state === 'ok') return;
    setState('checking');
    const result = await verifyCode(phone, value);
    if (result === 'ok') {
      setState('ok');
      notify(Haptics.NotificationFeedbackType.Success);
      setTimeout(onVerified, reduceMotion ? 0 : 650);
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

  const onChange = (next: string) => {
    if (state === 'wrong') setState('idle');
    setCode(next);
    if (isCompleteOtp(next)) check(next);
  };

  const resend = async () => {
    setSeconds(RESEND_SECONDS);
    setCode('');
    setState('idle');
    await sendCode(phone);
  };

  return (
    <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(240)} style={styles.block}>
      <View style={styles.head}>
        <AppText weight="medium" size={12.5} lineHeight={18} color={c.muted}>
          {t.codeLabel}
        </AppText>
        <Badge tone="ok" icon="whatsapp" label={L('عبر واتساب', 'via WhatsApp')} />
      </View>
      <AppText variant="small" color={c.muted}>
        {L('أرسلنا رمزًا من 6 أرقام إلى ', 'We sent a 6-digit code to ')}
        <AppText variant="small" weight="semibold" style={styles.ltr}>{`⁦${display}⁩`}</AppText>
      </AppText>
      <OtpInput inputRef={inputRef} value={code} onChange={onChange} state={state} shakeKey={shakeKey} />
      <View style={styles.links}>
        {seconds > 0 ? (
          <AppText variant="small" color={c.muted}>
            {L('إعادة الإرسال بعد ', 'Resend in ')}
            <AppText variant="small" color={c.muted} style={styles.ltr}>
              {clock(seconds)}
            </AppText>
          </AppText>
        ) : (
          <PressableScale accessibilityRole="button" onPress={resend} style={styles.link} haptic={false}>
            <AppText variant="small" weight="semibold">
              {t.resend}
            </AppText>
          </PressableScale>
        )}
        <PressableScale accessibilityRole="button" onPress={onChangeNumber} style={styles.link} haptic={false}>
          <AppText variant="small" weight="semibold">
            {t.changeNumber}
          </AppText>
        </PressableScale>
      </View>
      {state === 'wrong' && (
        <AppText size={12.5} color={c.bad} accessibilityLiveRegion="assertive">
          {t.wrong}
        </AppText>
      )}
      <Note tone="acc" icon="info">
        {t.devHint(DEMO_CODE)}
      </Note>
      <Button
        label={state === 'ok' ? t.verified : L('تأكيد ومتابعة', 'Confirm and continue')}
        icon={state === 'ok' ? 'check' : undefined}
        loading={state === 'checking'}
        disabled={!isCompleteOtp(code) && state !== 'ok'}
        onPress={() => check(code)}
        style={styles.confirm}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ltr: { writingDirection: 'ltr' },
  links: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { minHeight: 36, justifyContent: 'center' },
  confirm: { marginTop: 8 },
});
