import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
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
    const spring = { damping: 18, stiffness: 220 };
    indicatorX.set(reduceMotion ? activeFrame.x : withSpring(activeFrame.x, spring));
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
          display: `+${country.dial} ${formatNational(phoneCheck.national, country)}`,
          mode: mode === 0 ? 'signUp' : 'signIn',
          name: name.trim(),
        },
      });
    } finally {
      setSending(false);
    }
  };

  const layout = reduceMotion ? undefined : LinearTransition.springify().damping(18);

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.springify().damping(16)} style={[styles.hero, { backgroundColor: c.hero }]}>
            <View style={[styles.logo, { backgroundColor: brand.sand }]}>
              <AppText weight="bold" size={15} color={brand.ink} style={styles.ltr}>
                SQ AI
              </AppText>
            </View>
            <AppText weight="semibold" size={30} lineHeight={40} color={c.heroText} style={styles.heroTitle}>
              {t.welcome}
            </AppText>
            <AppText size={14.5} lineHeight={24} color={c.heroMuted}>
              {t.subtitle}
            </AppText>
          </Animated.View>

          <View accessibilityRole="tablist" style={[styles.segment, { backgroundColor: c.tile }]}>
            {activeFrame && <Animated.View style={[styles.segIndicator, { backgroundColor: c.primary }, indicatorStyle]} />}
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
                  <AppText weight="semibold" size={15} color={active ? c.onPrimary : c.text}>
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
                  entering={reduceMotion ? undefined : FadeInDown.springify().damping(16)}
                  exiting={reduceMotion ? undefined : FadeOutUp.duration(160)}
                  style={[styles.field, { backgroundColor: c.tile }]}>
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
                      { color: c.text, borderBottomColor: focused === 'name' ? c.primary : c.fieldLine },
                    ]}
                  />
                  {nameError && (
                    <AppText size={13} color={c.bad} accessibilityLiveRegion="polite">
                      {nameError}
                    </AppText>
                  )}
                </Animated.View>
              )}

              <Animated.View layout={layout} style={[styles.field, { backgroundColor: c.tile }]}>
                <AppText weight="medium" size={13} color={c.muted} nativeID="phone-label">
                  {t.phoneLabel}
                </AppText>
                <View style={styles.phoneRow}>
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`${t.countryLabel}: ${country.nameAr} +${country.dial}`}
                    onPress={() => setPickerOpen(true)}
                    style={[styles.country, { backgroundColor: c.bg }]}>
                    <AppText weight="semibold" size={17}>{`+${country.dial}`}</AppText>
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
                      { color: c.text, borderBottomColor: focused === 'phone' ? c.primary : c.fieldLine },
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
            <Button label={t.google} variant="secondary" height={52} onPress={() => setSocialNote(true)} />
            <Button label={t.apple} variant="secondary" height={52} onPress={() => setSocialNote(true)} />
          </View>
          {socialNote && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.note, { backgroundColor: c.accSoft }]}>
              <AppText size={13} color={c.acc} accessibilityLiveRegion="polite">
                {t.socialLater}
              </AppText>
            </Animated.View>
          )}

          <AppText size={12.5} color={c.muted} center>
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
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  hero: { borderRadius: radius.tile, padding: 22, gap: 8, minHeight: 210 },
  heroTitle: { marginTop: 'auto' },
  logo: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  ltr: { writingDirection: 'ltr' },
  segment: { flexDirection: 'row', borderRadius: 20, padding: 4, height: 56 },
  segIndicator: { position: 'absolute', top: 4, bottom: 4, left: 0, borderRadius: 16 },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  form: { gap: 10 },
  field: { borderRadius: radius.tile, paddingHorizontal: 18, paddingVertical: 16, gap: 8 },
  input: {
    fontFamily: 'ReadexPro_400Regular',
    fontSize: 18,
    minHeight: 46,
    borderBottomWidth: 2,
    paddingVertical: 6,
    textAlign: 'right',
  },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, direction: 'ltr' },
  country: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 46, paddingHorizontal: 12, borderRadius: 14 },
  phoneInput: { flex: 1, textAlign: 'left', writingDirection: 'ltr' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  rule: { flex: 1, height: 1 },
  socialRow: { gap: 10 },
  note: { borderRadius: 16, padding: 12 },
});
