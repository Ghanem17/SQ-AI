import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { checkPhone, defaultCountry, formatNational, paletteNames, radius, type AccountType, type Country, type PaletteName } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale, tapHaptic } from '@/components/PressableScale';
import { arts, DayShapes, Glow, PaletteBar, PillStack, type Art } from '@/features/auth/art';
import { sendCode } from '@/features/auth/authService';
import { CountryPicker } from '@/features/auth/CountryPicker';
import { LangSwitch } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/theme';

type Mode = 'signIn' | 'signUp';

// Field colors for the two looks: the night glow and the day sheet.
type Skin = { field: string; border: string; focus: string; text: string; label: string; hint: string; placeholder: string };

// Sign in and sign up on one screen. Dark mode shows the night look (glow and
// stacked pills), light mode the day look (dark panel over a white sheet),
// each in the chosen palette. New accounts pick their type and colors here,
// so they go straight to the app after the code.
export default function AuthScreen() {
  const { c, scheme, palette } = useTheme();
  const { setPalette } = useSession();
  const { t: all, L, rtl } = useI18n();
  const t = all.auth;
  const reduceMotion = useReducedMotion();
  const night = scheme === 'dark';
  const art = arts[palette];

  const [mode, setMode] = useState<Mode>('signIn');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<Country>(defaultCountry);
  const [type, setType] = useState<AccountType>('shop');
  const [showErrors, setShowErrors] = useState(false);
  const [sending, setSending] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [socialNote, setSocialNote] = useState(false);
  const [focused, setFocused] = useState<'name' | 'phone' | null>(null);

  const skin: Skin = night
    ? { field: `${art.panel}E6`, border: art.slate, focus: art.accent, text: art.light, label: art.muted, hint: art.muted, placeholder: c.placeholder }
    : { field: c.tile, border: c.line, focus: c.primary, text: c.text, label: c.muted, hint: c.placeholder, placeholder: c.placeholder };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    tapHaptic();
    setMode(next);
    setShowErrors(false);
  };

  // Swiping the form switches modes; the new-account side is on the left in
  // Arabic and on the right in English.
  const drag = useSharedValue(0);
  const toward = rtl ? 1 : -1;
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
      if (e.translationX * toward > 60) scheduleOnRN(switchMode, 'signUp' as Mode);
      else if (e.translationX * toward < -60) scheduleOnRN(switchMode, 'signIn' as Mode);
    },
  });
  const formStyle = useAnimatedStyle(() => ({ transform: [{ translateX: drag.value }] }));

  const phoneCheck = checkPhone(phone, country);
  const signUp = mode === 'signUp';
  const nameMissing = signUp && name.trim().length === 0;
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
          display: `+${country.dial} ${formatNational(phoneCheck.national, country)}`.replace(/ /g, ' '),
          mode,
          name: name.trim(),
          ...(signUp ? { accountType: type } : {}),
        },
      });
    } finally {
      setSending(false);
    }
  };

  const layout = reduceMotion ? undefined : LinearTransition.duration(200);
  const appear = reduceMotion ? undefined : FadeIn.duration(200);
  const leave = reduceMotion ? undefined : FadeOut.duration(140);

  const fieldStyle = (key: 'name' | 'phone') => [
    styles.input,
    { textAlign: rtl ? ('right' as const) : ('left' as const) },
    { color: skin.text, backgroundColor: skin.field, borderColor: focused === key ? skin.focus : skin.border, borderWidth: focused === key ? 1.5 : 1 },
  ];

  const form = (
    <GestureDetector gesture={swipe}>
      <Animated.View style={[styles.form, formStyle]} layout={layout} accessibilityHint={t.swipeHint}>
        {signUp && (
          <Animated.View entering={appear} exiting={leave} style={styles.field}>
            <AppText weight="medium" size={13} color={skin.label} nativeID="name-label">
              {t.nameLabel}
            </AppText>
            <TextInput
              accessibilityLabelledBy="name-label"
              value={name}
              onChangeText={setName}
              placeholder={t.namePlaceholder}
              placeholderTextColor={skin.placeholder}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              autoComplete="organization"
              returnKeyType="next"
              style={fieldStyle('name')}
            />
            {nameError && (
              <AppText size={12.5} color={c.bad} accessibilityLiveRegion="polite">
                {nameError}
              </AppText>
            )}
          </Animated.View>
        )}

        <Animated.View layout={layout} style={styles.field}>
          <AppText weight="medium" size={13} color={skin.label} nativeID="phone-label">
            {t.phoneLabel}
          </AppText>
          <View style={styles.phoneRow}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`${t.countryLabel}: ${rtl ? country.nameAr : country.nameEn} +${country.dial}`}
              onPress={() => setPickerOpen(true)}
              style={[styles.country, { backgroundColor: skin.field, borderColor: skin.border }]}>
              <AppText weight="medium" size={15} color={skin.text} style={styles.ltr}>{`+${country.dial}`}</AppText>
              <Icon name="chevronDown" color={skin.hint} size={14} strokeWidth={2} />
            </PressableScale>
            <TextInput
              accessibilityLabelledBy="phone-label"
              value={phone}
              onChangeText={setPhone}
              placeholder={formatNational('7701234567', country)}
              placeholderTextColor={skin.placeholder}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              onFocus={() => setFocused('phone')}
              onBlur={() => setFocused(null)}
              onSubmitEditing={submit}
              style={[fieldStyle('phone'), styles.phoneInput]}
            />
          </View>
          {phoneError ? (
            <AppText size={12.5} color={c.bad} accessibilityLiveRegion="polite">
              {phoneError}
            </AppText>
          ) : (
            <AppText size={12} color={skin.hint}>
              {t.phoneHint}
            </AppText>
          )}
        </Animated.View>

        {signUp && (
          <Animated.View entering={appear} exiting={leave} style={styles.field}>
            <AppText weight="medium" size={13} color={skin.label}>
              {L('نوع الحساب', 'Account type')}
            </AppText>
            <View accessibilityRole="radiogroup" style={styles.pair}>
              <Choice icon="store" label={all.accountType.shop.title} selected={type === 'shop'} onPress={() => setType('shop')} night={night} art={art} />
              <Choice icon="video" label={all.accountType.creator.title} selected={type === 'creator'} onPress={() => setType('creator')} night={night} art={art} />
            </View>
          </Animated.View>
        )}

        {signUp && (
          <Animated.View entering={appear} exiting={leave} style={styles.field}>
            <AppText weight="medium" size={13} color={skin.label}>
              {L('ألوان التطبيق', 'App colors')}
            </AppText>
            <View accessibilityRole="radiogroup" style={styles.pair}>
              {(['ocean', 'rose'] as PaletteName[]).map((p) => (
                <PaletteChoice key={p} name={p} selected={palette === p} onPress={() => setPalette(p)} night={night} art={art} />
              ))}
            </View>
          </Animated.View>
        )}

        <Animated.View layout={layout}>
          <Button
            label={sending ? t.sending : signUp ? L('أنشئ حسابي', 'Create my account') : L('أرسل رمز الدخول', 'Send sign-in code')}
            loading={sending}
            onPress={submit}
            height={54}
            colors={{ bg: c.heroBtn, fg: c.heroBtnText }}
          />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );

  const social = (
    <>
      <View style={styles.socialRow}>
        {['Google', 'Apple'].map((label) => (
          <Button
            key={label}
            label={label}
            variant="secondary"
            height={46}
            style={[styles.flex, night && { borderWidth: 1, borderColor: art.slate }]}
            colors={night ? { bg: 'transparent', fg: art.light } : undefined}
            onPress={() => setSocialNote(true)}
          />
        ))}
      </View>
      {socialNote && (
        <Animated.View entering={appear} style={[styles.note, { backgroundColor: night ? `${art.panel}E6` : c.accSoft }]}>
          <AppText size={12.5} color={night ? art.muted : c.acc} accessibilityLiveRegion="polite">
            {t.socialLater}
          </AppText>
        </Animated.View>
      )}
    </>
  );

  const picker = (
    <CountryPicker
      visible={pickerOpen}
      selected={country}
      onSelect={(next) => {
        setCountry(next);
        setPickerOpen(false);
      }}
      onClose={() => setPickerOpen(false)}
    />
  );

  if (night) {
    return (
      <View style={[styles.flex, styles.clip, { direction: rtl ? 'rtl' : 'ltr', backgroundColor: art.deep }]}>
        <Glow id="nightA" color={art.glowA} size={360} style={{ left: -190, top: 120 }} />
        <Glow id="nightB" color={art.glowB} size={380} style={{ right: -200, top: 150 }} />
        <Glow id="nightC" color={art.slate} size={420} style={{ left: -15, top: -230 }} strength={0.5} />
        <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.nightContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Logo art={art} />
              {signUp ? (
                <Animated.View key="bar" entering={appear} style={styles.barWrap}>
                  <PaletteBar art={art} />
                </Animated.View>
              ) : (
                <Animated.View key="pills" entering={appear} style={styles.pillsWrap}>
                  <PillStack art={art} result={L('طلبات أكثر', 'More orders')} figure={L('\u20662,100\u2069 د.ع للطلب', 'IQD 2,100 per order')} />
                </Animated.View>
              )}
              <View style={styles.titles}>
                <AppText weight="semibold" size={28} lineHeight={38} color={art.light}>
                  {signUp ? L('ابدأ خلال دقيقة', 'Start in a minute') : L('أهلًا بعودتك', 'Welcome back')}
                </AppText>
                <AppText size={14} lineHeight={22} color={art.muted}>
                  {signUp ? L('الريل الأول مجاني، ولا حاجة إلى بطاقة دفع.', 'Your first reel is free. No card needed.') : t.subtitle}
                </AppText>
              </View>
              {form}
              {!signUp && social}
              <View style={styles.switchRow}>
                <AppText size={13.5} color={art.muted}>
                  {signUp ? L('لديك حساب؟', 'Have an account?') : L('ليس لديك حساب؟', 'No account yet?')}
                </AppText>
                <PressableScale accessibilityRole="button" onPress={() => switchMode(signUp ? 'signIn' : 'signUp')} style={styles.switchBtn}>
                  <AppText weight="semibold" size={13.5} color={art.accent}>
                    {signUp ? L('سجّل الدخول', 'Sign in') : L('أنشئ حسابًا', 'Create one')}
                  </AppText>
                </PressableScale>
              </View>
              <AppText size={11.5} color={art.muted} center>
                {t.terms}
              </AppText>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
        {picker}
      </View>
    );
  }

  const panelHeight = signUp ? 210 : 372;
  return (
    <View style={[styles.flex, styles.clip, { direction: rtl ? 'rtl' : 'ltr', backgroundColor: art.panel }]}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.dayScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
            <Animated.View layout={layout} style={[styles.panel, { height: panelHeight }]}>
              <DayShapes art={art} compact={signUp} />
              <View style={styles.dayLang}>
                <LangSwitch color={art.light} border={art.slate} />
              </View>
              <View style={styles.panelText}>
                <AppText weight="semibold" size={signUp ? 26 : 30} lineHeight={signUp ? 36 : 40} color={art.light}>
                  {signUp ? L('حساب جديد', 'New account') : L('تسويقك يعمل تلقائيًا', 'Marketing that runs itself')}
                </AppText>
                {!signUp && (
                  <AppText size={14} color={art.muted}>
                    {L('صوّر، ونحن نتولى الباقي.', 'You film, we handle the rest.')}
                  </AppText>
                )}
              </View>
            </Animated.View>
            <View style={[styles.sheet, { backgroundColor: c.bg }]}>
              <Tabs mode={mode} onChange={switchMode} />
              {form}
              {!signUp && (
                <>
                  <View style={styles.orRow}>
                    <View style={[styles.rule, { backgroundColor: c.line }]} />
                    <AppText size={12} color={c.placeholder}>
                      {all.common.or}
                    </AppText>
                    <View style={[styles.rule, { backgroundColor: c.line }]} />
                  </View>
                  {social}
                </>
              )}
              <View style={[styles.trust, { backgroundColor: c.priSoft }]}>
                <Icon name="shield" color={c.onPriSoft} size={17} />
                <AppText size={12.5} lineHeight={18} color={c.onPriSoft} style={styles.flex}>
                  {L('لا نطلب كلمة مرور، ولا ننشر شيئًا دون موافقتك.', 'No password needed, and nothing is posted without your approval.')}
                </AppText>
              </View>
              <AppText size={11.5} color={c.placeholder} center>
                {t.terms}
              </AppText>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      {picker}
    </View>
  );
}

function Logo({ art }: { art: Art }) {
  return (
    <View style={styles.logoRow}>
      <View style={styles.logoEnd}>
        <LangSwitch color={art.light} border={art.slate} />
      </View>
      <View style={[styles.logo, { backgroundColor: art.finalPill.bg }]}>
        <AppText weight="bold" size={13} color={art.finalPill.fg} style={styles.ltr}>
          SQ
        </AppText>
      </View>
      <AppText weight="semibold" size={15} color={art.light} style={styles.ltr}>
        SQ AI
      </AppText>
    </View>
  );
}

function Tabs({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const { c } = useTheme();
  const t = useI18n().t.auth;
  const items: { value: Mode; label: string }[] = [
    { value: 'signIn', label: t.tabs.signIn },
    { value: 'signUp', label: t.tabs.signUp },
  ];
  return (
    <View accessibilityRole="tablist" style={[styles.tabs, { backgroundColor: c.tile }]}>
      {items.map((it) => {
        const active = it.value === mode;
        return (
          <PressableScale
            key={it.value}
            haptic={false}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(it.value)}
            style={[styles.tab, active && { backgroundColor: c.hero }]}>
            <AppText weight={active ? 'semibold' : 'regular'} size={14} color={active ? c.heroText : c.muted}>
              {it.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

function Tile({ selected, onPress, label, night, art, children }: { selected: boolean; onPress: () => void; label: string; night: boolean; art: Art; children: ReactNode }) {
  const { c } = useTheme();
  const border = selected ? (night ? art.accent : c.primary) : night ? art.slate : c.line;
  const bg = selected && night ? `${art.accent}24` : night ? `${art.panel}99` : c.card;
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.tile, { borderColor: border, borderWidth: selected ? 1.5 : 1, backgroundColor: bg }]}>
      {children}
    </PressableScale>
  );
}

function Choice({ icon, label, selected, onPress, night, art }: { icon: IconName; label: string; selected: boolean; onPress: () => void; night: boolean; art: Art }) {
  const { c } = useTheme();
  const fg = night ? (selected ? art.light : art.muted) : selected ? c.text : c.muted;
  const iconColor = night ? (selected ? art.accent : art.muted) : selected ? c.primary : c.muted;
  return (
    <Tile selected={selected} onPress={onPress} label={label} night={night} art={art}>
      <Icon name={icon} color={iconColor} size={21} />
      <AppText weight={selected ? 'semibold' : 'regular'} size={13.5} color={fg} center>
        {label}
      </AppText>
    </Tile>
  );
}

function PaletteChoice({ name, selected, onPress, night, art }: { name: PaletteName; selected: boolean; onPress: () => void; night: boolean; art: Art }) {
  const { c } = useTheme();
  const { pick } = useI18n();
  const s = arts[name].swatches;
  const dots = [s[0], s[2], s[4]];
  return (
    <Tile selected={selected} onPress={onPress} label={pick(paletteNames[name])} night={night} art={art}>
      <View style={styles.dots}>
        {dots.map((d, i) => (
          <View key={d} style={[styles.dot, { backgroundColor: d, marginLeft: i ? -4 : 0, borderColor: night ? art.deep : c.card }]} />
        ))}
      </View>
      <AppText weight={selected ? 'semibold' : 'regular'} size={13.5} color={night ? (selected ? art.light : art.muted) : selected ? c.text : c.muted}>
        {pick(paletteNames[name])}
      </AppText>
    </Tile>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  clip: { overflow: 'hidden' },
  ltr: { writingDirection: 'ltr' },
  nightContent: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, gap: 16, flexGrow: 1 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoEnd: { position: 'absolute', end: 0 },
  dayLang: { position: 'absolute', top: 12, end: 20, zIndex: 2 },
  logo: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pillsWrap: { marginTop: 8 },
  barWrap: { marginTop: 10 },
  titles: { gap: 2, marginTop: 6 },
  form: { gap: 14 },
  field: { gap: 6 },
  input: { fontFamily: 'ReadexPro_400Regular', fontSize: 16, height: 52, borderRadius: 14, paddingHorizontal: 14 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, direction: 'ltr' },
  country: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 52, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1 },
  phoneInput: { flex: 1, textAlign: 'left', writingDirection: 'ltr' },
  pair: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, minHeight: 70, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  dots: { flexDirection: 'row', direction: 'ltr' },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5 },
  socialRow: { flexDirection: 'row', gap: 8 },
  note: { borderRadius: radius.control, padding: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 'auto' },
  switchBtn: { minHeight: 44, justifyContent: 'center' },
  dayScroll: { flexGrow: 1 },
  panel: { overflow: 'hidden', justifyContent: 'flex-end' },
  panelText: { paddingHorizontal: 24, paddingBottom: 30, gap: 2 },
  sheet: { flexGrow: 1, marginTop: -24, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 22, paddingBottom: 20, gap: 16 },
  tabs: { flexDirection: 'row', borderRadius: 14, padding: 4 },
  tab: { flex: 1, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth },
  trust: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 12 },
});
