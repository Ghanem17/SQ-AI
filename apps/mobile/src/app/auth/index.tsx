import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { brand, checkPhone, defaultCountry, formatNational, radius, type Country } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale, tapHaptic } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { sendCode } from '@/features/auth/authService';
import { CountryPicker } from '@/features/auth/CountryPicker';
import { ar } from '@/i18n/ar';
import { useTheme } from '@/theme/theme';

const t = ar.auth;
type Mode = 0 | 1; // 0 = new account, 1 = sign in

export default function AuthScreen() {
  const { c } = useTheme();
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<Mode>(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<Country>(defaultCountry);
  const [showErrors, setShowErrors] = useState(false);
  const [sending, setSending] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [socialNote, setSocialNote] = useState(false);
  const [focused, setFocused] = useState<'name' | 'phone' | null>(null);
  const [segFrames, setSegFrames] = useState<Record<number, { x: number; width: number }>>({});

  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const drag = useSharedValue(0);
  const activeFrame = segFrames[mode];

  // Layout x is physical on every platform, so the indicator follows the
  // selected tab whatever the layout direction.
  useEffect(() => {
    if (!activeFrame) return;
    indicatorX.set(reduceMotion ? activeFrame.x : withTiming(activeFrame.x, { duration: 200, easing: Easing.out(Easing.cubic) }));
    indicatorW.set(activeFrame.width);
  }, [activeFrame, reduceMotion, indicatorX, indicatorW]);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    tapHaptic();
    setMode(next);
    setShowErrors(false);
  };

  // Swiping the form switches between the two modes. In RTL the second tab
  // sits on the left, so dragging to the right moves to it.
  const swipe = usePanGesture({
    activeOffsetX: [-16, 16],
    failOffsetY: [-20, 20],
    onUpdate: (e) => {
      'worklet';
      drag.value = e.translationX * 0.25;
    },
    onDeactivate: (e) => {
      'worklet';
      drag.value = withSpring(0, { damping: 16 });
      if (e.translationX > 60) scheduleOnRN(switchMode, 1 as Mode);
      else if (e.translationX < -60) scheduleOnRN(switchMode, 0 as Mode);
    },
  });

  const indicatorStyle = useAnimatedStyle(() => ({ width: indicatorW.get(), transform: [{ translateX: indicatorX.get() }] }));
  const formStyle = useAnimatedStyle(() => ({ transform: [{ translateX: drag.value }] }));

  const phoneCheck = checkPhone(phone, country);
  const nameMissing = mode === 0 && name.trim().length === 0;
  const phoneError = showErrors && !phoneCheck.ok ? t.phoneErrors[phoneCheck.reason] : null;
  const nameError = showErrors && nameMissing ? t.nameError : null;

  const submit = async () => {
    setShowErrors(true);
    if (!phoneCheck.ok || nameMissing) return;
    setSending(true);
    try {
      await sendCode(phoneCheck.e164);
      router.push({
        pathname: '/auth/verify',
        params: {
          phone: phoneCheck.e164,
          display: `+${country.dial} ${formatNational(phoneCheck.national, country)}`.replace(/ /g, '\u00A0'),
          mode: mode === 0 ? 'signUp' : 'signIn',
          name: name.trim(),
        },
      });
    } finally {
      setSending(false);
    }
  };

  const layout = reduceMotion ? undefined : LinearTransition.duration(200);

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(260)} style={styles.hero}>
            <View style={styles.brandRow}>
              <View style={[styles.logo, { backgroundColor: brand.teal }]}>
                <AppText weight="bold" size={13} color={brand.cream} style={styles.ltr}>
                  SQ
                </AppText>
              </View>
              <AppText weight="semibold" size={15} style={styles.ltr}>
                SQ AI
              </AppText>
            </View>
            <AppText weight="semibold" size={26} lineHeight={36} style={styles.heroTitle}>
              {t.welcome}
            </AppText>
            <AppText size={14} lineHeight={22} color={c.muted}>
              {t.subtitle}
            </AppText>
          </Animated.View>

          <View accessibilityRole="tablist" style={[styles.segment, { backgroundColor: c.tile }]}>
            {activeFrame && <Animated.View style={[styles.segIndicator, { backgroundColor: c.card, borderColor: c.line }, indicatorStyle]} />}
            {([0, 1] as Mode[]).map((m) => {
              const active = m === mode;
              return (
                <PressableScale
                  key={m}
                  haptic={false}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => switchMode(m)}
                  onLayout={(e) => {
                    const { x, width } = e.nativeEvent.layout;
                    setSegFrames((prev) => (prev[m]?.x === x && prev[m]?.width === width ? prev : { ...prev, [m]: { x, width } }));
                  }}
                  style={styles.segItem}>
                  <AppText weight={active ? 'semibold' : 'regular'} size={14} color={active ? c.text : c.muted}>
                    {m === 0 ? t.tabs.signUp : t.tabs.signIn}
                  </AppText>
                </PressableScale>
              );
            })}
          </View>

          <GestureDetector gesture={swipe}>
            <Animated.View style={[styles.form, formStyle]} accessibilityHint={t.swipeHint} layout={layout}>
              {mode === 0 && (
                <Animated.View
                  entering={reduceMotion ? undefined : FadeIn.duration(200)}
                  exiting={reduceMotion ? undefined : FadeOut.duration(140)}
                  style={styles.field}>
                  <AppText weight="medium" size={13} color={c.muted} nativeID="name-label">
                    {t.nameLabel}
                  </AppText>
                  <TextInput
                    accessibilityLabelledBy="name-label"
                    value={name}
                    onChangeText={setName}
                    placeholder={t.namePlaceholder}
                    placeholderTextColor={c.placeholder}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                    autoComplete="organization"
                    returnKeyType="next"
                    style={[
                      styles.input,
                      { color: c.text, backgroundColor: c.card, borderColor: focused === 'name' ? c.primary : c.fieldLine },
                    ]}
                  />
                  {nameError && (
                    <AppText size={13} color={c.bad} accessibilityLiveRegion="polite">
                      {nameError}
                    </AppText>
                  )}
                </Animated.View>
              )}

              <Animated.View layout={layout} style={styles.field}>
                <AppText weight="medium" size={13} color={c.muted} nativeID="phone-label">
                  {t.phoneLabel}
                </AppText>
                <View style={styles.phoneRow}>
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`${t.countryLabel}: ${country.nameAr} +${country.dial}`}
                    onPress={() => setPickerOpen(true)}
                    style={[styles.country, { backgroundColor: c.card, borderColor: c.fieldLine }]}>
                    <AppText weight="medium" size={16}>{`+${country.dial}`}</AppText>
                    <Icon name="chevronDown" color={c.muted} size={14} strokeWidth={2} />
                  </PressableScale>
                  <TextInput
                    accessibilityLabelledBy="phone-label"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder={formatNational('7701234567', country)}
                    placeholderTextColor={c.placeholder}
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                    onFocus={() => setFocused('phone')}
                    onBlur={() => setFocused(null)}
                    onSubmitEditing={submit}
                    style={[
                      styles.input,
                      styles.phoneInput,
                      { color: c.text, backgroundColor: c.card, borderColor: focused === 'phone' ? c.primary : c.fieldLine },
                    ]}
                  />
                </View>
                {phoneError ? (
                  <AppText size={13} color={c.bad} accessibilityLiveRegion="polite">
                    {phoneError}
                  </AppText>
                ) : (
                  <AppText size={12.5} color={c.muted}>
                    {t.phoneHint}
                  </AppText>
                )}
              </Animated.View>

              <Animated.View layout={layout}>
                <Button label={sending ? t.sending : t.sendCode} loading={sending} onPress={submit} />
              </Animated.View>
            </Animated.View>
          </GestureDetector>

          <View style={styles.orRow}>
            <View style={[styles.rule, { backgroundColor: c.line }]} />
            <AppText size={13} color={c.muted}>
              {ar.common.or}
            </AppText>
            <View style={[styles.rule, { backgroundColor: c.line }]} />
          </View>

          <View style={styles.socialRow}>
            <Button label={t.google} variant="secondary" onPress={() => setSocialNote(true)} />
            <Button label={t.apple} variant="secondary" onPress={() => setSocialNote(true)} />
          </View>
          {socialNote && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.note, { backgroundColor: c.accSoft }]}>
              <AppText size={13} color={c.acc} accessibilityLiveRegion="polite">
                {t.socialLater}
              </AppText>
            </Animated.View>
          )}

          <AppText size={12} color={c.placeholder} center>
            {t.terms}
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>

      <CountryPicker
        visible={pickerOpen}
        selected={country}
        onSelect={(next) => {
          setCountry(next);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 14, paddingBottom: 32 },
  hero: { gap: 6, paddingTop: 8, paddingBottom: 10 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 22 },
  heroTitle: {},
  logo: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  ltr: { writingDirection: 'ltr' },
  segment: { flexDirection: 'row', borderRadius: radius.control, padding: 3, height: 44 },
  segIndicator: { position: 'absolute', top: 3, bottom: 3, left: 0, borderRadius: radius.control - 3, borderWidth: StyleSheet.hairlineWidth * 2 },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.control - 3 },
  form: { gap: 14 },
  field: { gap: 6 },
  input: {
    fontFamily: 'ReadexPro_400Regular',
    fontSize: 16,
    height: 50,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: 14,
    textAlign: 'right',
  },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, direction: 'ltr' },
  country: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 50, paddingHorizontal: 12, borderRadius: radius.control, borderWidth: 1 },
  phoneInput: { flex: 1, textAlign: 'left', writingDirection: 'ltr' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth },
  socialRow: { gap: 8 },
  note: { borderRadius: radius.control, padding: 12 },
});
