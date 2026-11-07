import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useReducedMotion } from 'react-native-reanimated';

import { checkPhone, defaultCountry, font, formatNational, paletteNames, palettes, radius, type AccountType, type Country, type PaletteName } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { IraqFlag, Monogram } from '@/components/brand';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale, tapHaptic } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { Field, IconButton, LangSwitch, Note, Segmented } from '@/components/ui';
import { sendCode } from '@/features/auth/authService';
import { CountryPicker } from '@/features/auth/CountryPicker';
import { OtpBlock } from '@/features/auth/OtpBlock';
import { useI18n } from '@/i18n';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/theme';

type Mode = 'signIn' | 'signUp';

// Sign in and sign up on one screen: phone number, then the WhatsApp code
// inline. New accounts also give a name, pick their type and colors here, so
// they go straight to the app after the code.
export default function AuthScreen() {
  const { c, palette } = useTheme();
  const { setPalette, signIn, chooseAccountType, accountType } = useSession();
  const { t: all, L, rtl, pick } = useI18n();
  const t = all.auth;
  const reduceMotion = useReducedMotion();
  const params = useLocalSearchParams<{ mode?: string }>();

  const [mode, setMode] = useState<Mode>(params.mode === 'signUp' ? 'signUp' : 'signIn');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<Country>(defaultCountry);
  const [type, setType] = useState<AccountType>('shop');
  const [showErrors, setShowErrors] = useState(false);
  const [sending, setSending] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [socialNote, setSocialNote] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [sent, setSent] = useState<{ e164: string; display: string } | null>(null);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    tapHaptic();
    setMode(next);
    setShowErrors(false);
    setSent(null);
  };

  const phoneCheck = checkPhone(phone, country);
  // Groups a plain national number as it is typed ("770 123 4567"); anything
  // else (a leading 0, +964, Arabic digits) is shown as typed.
  const shownPhone = /^[1-9]\d*$/.test(phone) && phone.length <= country.length ? formatNational(phone, country) : phone;
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
      setSent({ e164: phoneCheck.e164, display: `+${country.dial} ${formatNational(phoneCheck.national, country)}` });
    } finally {
      setSending(false);
    }
  };

  const verified = () => {
    if (!sent) return;
    signIn(sent.e164, signUp && name.trim() ? name.trim() : null);
    if (signUp) {
      chooseAccountType(type);
      router.replace('/');
    } else {
      router.replace(accountType ? '/' : '/auth/account-type');
    }
  };

  const layout = reduceMotion ? undefined : LinearTransition.duration(200);
  const appear = reduceMotion ? undefined : FadeIn.duration(200);
  const leave = reduceMotion ? undefined : FadeOut.duration(140);
  const phoneBorder = phoneError ? c.bad : phoneFocused ? c.primary : c.line;

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <IconButton icon="back" label={all.common.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/onboarding'))} />
        <LangSwitch />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Monogram size={44} />
          <View style={styles.titles}>
            <AppText variant="h1" accessibilityRole="header">
              {signUp ? t.tabs.signUp : t.tabs.signIn}
            </AppText>
            <AppText variant="body" color={c.muted}>
              {signUp ? L('أنشئ حسابك برقم هاتفك، وسنرسل إليك رمز تحقق عبر واتساب.', 'Create your account with your phone number; we send a code on WhatsApp.') : t.subtitle}
            </AppText>
          </View>

          <Segmented<Mode>
            options={[
              { value: 'signUp', label: t.tabs.signUp },
              { value: 'signIn', label: t.tabs.signIn },
            ]}
            value={mode}
            onChange={switchMode}
          />

          {signUp && (
            <Animated.View entering={appear} exiting={leave}>
              <Field label={t.nameLabel} value={name} onChangeText={setName} placeholder={t.namePlaceholder} autoComplete="organization" returnKeyType="next" error={nameError} editable={!sent} />
            </Animated.View>
          )}

          <Animated.View layout={layout} style={styles.field}>
            <AppText weight="medium" size={12.5} lineHeight={18} color={c.muted} nativeID="phone-label">
              {t.phoneLabel}
            </AppText>
            <View style={styles.phoneRow}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`${t.countryLabel}: ${rtl ? country.nameAr : country.nameEn} +${country.dial}`}
                onPress={() => setPickerOpen(true)}
                disabled={!!sent}
                style={[styles.country, { backgroundColor: c.card, borderColor: c.line }]}>
                {country.code === 'IQ' ? (
                  <IraqFlag />
                ) : (
                  <AppText weight="semibold" size={11} color={c.muted}>
                    {country.code}
                  </AppText>
                )}
                <AppText weight="semibold" size={14} lineHeight={20} style={styles.ltr}>{`+${country.dial}`}</AppText>
                <View style={styles.countryChevron}>
                  <Icon name="chevronDown" color={c.placeholder} size={14} />
                </View>
              </PressableScale>
              <View style={[styles.number, { backgroundColor: c.card, borderColor: phoneBorder, borderWidth: phoneError || phoneFocused ? 1.5 : 1 }]}>
                <TextInput
                  accessibilityLabelledBy="phone-label"
                  accessibilityLabel={t.phoneLabel}
                  value={shownPhone}
                  onChangeText={(v) => setPhone(v.replace(/\s/g, ''))}
                  placeholder={formatNational('7701234567', country)}
                  placeholderTextColor={c.placeholder}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  editable={!sent}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  onSubmitEditing={submit}
                  style={[styles.phoneInput, { color: c.text }]}
                />
                {phoneCheck.ok && <Icon name="check" color={c.ok} size={18} strokeWidth={2} />}
              </View>
            </View>
            {phoneError ? (
              <AppText size={12.5} color={c.bad} accessibilityLiveRegion="polite">
                {phoneError}
              </AppText>
            ) : !sent ? (
              <AppText size={12} lineHeight={17} color={c.placeholder}>
                {t.phoneHint}
              </AppText>
            ) : null}
          </Animated.View>

          {signUp && !sent && (
            <Animated.View entering={appear} exiting={leave} style={styles.field}>
              <AppText weight="medium" size={12.5} lineHeight={18} color={c.muted}>
                {L('نوع الحساب', 'Account type')}
              </AppText>
              <View accessibilityRole="radiogroup" style={styles.pair}>
                <Choice icon="store" label={all.accountType.shop.title} selected={type === 'shop'} onPress={() => setType('shop')} />
                <Choice icon="video" label={all.accountType.creator.title} selected={type === 'creator'} onPress={() => setType('creator')} />
              </View>
            </Animated.View>
          )}

          {signUp && !sent && (
            <Animated.View entering={appear} exiting={leave} style={styles.field}>
              <AppText weight="medium" size={12.5} lineHeight={18} color={c.muted}>
                {L('ألوان التطبيق', 'App colors')}
              </AppText>
              <View accessibilityRole="radiogroup" style={styles.pair}>
                {(['ocean', 'rose'] as PaletteName[]).map((p) => (
                  <Tile key={p} selected={palette === p} label={pick(paletteNames[p])} onPress={() => setPalette(p)}>
                    <View style={styles.dots}>
                      {[palettes[p].light.hero, palettes[p].light.chartSoft, palettes[p].light.heroAccent].map((d, i) => (
                        <View key={d} style={[styles.dot, { backgroundColor: d, marginLeft: i ? -4 : 0, borderColor: c.card }]} />
                      ))}
                    </View>
                    <AppText weight={palette === p ? 'semibold' : 'medium'} size={13} color={palette === p ? c.text : c.muted}>
                      {pick(paletteNames[p])}
                    </AppText>
                  </Tile>
                ))}
              </View>
            </Animated.View>
          )}

          {sent ? (
            <OtpBlock phone={sent.e164} display={sent.display} onVerified={verified} onChangeNumber={() => setSent(null)} />
          ) : (
            <Animated.View layout={layout} style={styles.actions}>
              <Button label={sending ? t.sending : signUp ? L('أنشئ حسابي', 'Create my account') : L('أرسل رمز الدخول', 'Send sign-in code')} loading={sending} onPress={submit} />
              {!signUp && (
                <>
                  <View style={styles.orRow}>
                    <View style={[styles.rule, { backgroundColor: c.line }]} />
                    <AppText size={12} color={c.placeholder}>
                      {all.common.or}
                    </AppText>
                    <View style={[styles.rule, { backgroundColor: c.line }]} />
                  </View>
                  <View style={styles.pair}>
                    {['Google', 'Apple'].map((label) => (
                      <Button key={label} label={label} variant="secondary" height={46} style={styles.flex} onPress={() => setSocialNote(true)} />
                    ))}
                  </View>
                  {socialNote && <Note tone="acc">{t.socialLater}</Note>}
                </>
              )}
            </Animated.View>
          )}

          <AppText size={11.5} lineHeight={17} color={c.placeholder} center style={styles.terms}>
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

function Tile({ selected, onPress, label, children }: { selected: boolean; onPress: () => void; label: string; children: ReactNode }) {
  const { c, elev } = useTheme();
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.tile, { backgroundColor: c.card, borderColor: selected ? c.primary : c.line, borderWidth: selected ? 1.5 : 1 }, selected && elev.raised]}>
      {children}
    </PressableScale>
  );
}

function Choice({ icon, label, selected, onPress }: { icon: IconName; label: string; selected: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Tile selected={selected} onPress={onPress} label={label}>
      <Icon name={icon} color={selected ? c.text : c.muted} size={20} />
      <AppText weight={selected ? 'semibold' : 'medium'} size={13} color={selected ? c.text : c.muted} center>
        {label}
      </AppText>
    </Tile>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  ltr: { writingDirection: 'ltr' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56, paddingHorizontal: 20 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 18 },
  titles: { gap: 4, marginTop: -2 },
  field: { gap: 6 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, direction: 'ltr' },
  country: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 112, height: 52, paddingHorizontal: 12, borderRadius: radius.control, borderWidth: 1 },
  countryChevron: { marginLeft: 'auto' },
  number: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, borderRadius: radius.control, paddingHorizontal: 14 },
  phoneInput: { flex: 1, minWidth: 0, height: '100%', fontFamily: font.medium, fontSize: 15, letterSpacing: 0.5, textAlign: 'left', writingDirection: 'ltr', paddingVertical: 0 },
  pair: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, minHeight: 72, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 8 },
  dots: { flexDirection: 'row', direction: 'ltr' },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5 },
  actions: { gap: 14, marginTop: 4 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rule: { flex: 1, height: 1 },
  terms: { marginTop: 4 },
});
