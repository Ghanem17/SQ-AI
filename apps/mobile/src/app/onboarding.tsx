import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { brand, radius } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { HeroSurface, Monogram } from '@/components/brand';
import { Button } from '@/components/Button';
import { PressableScale } from '@/components/PressableScale';
import { LangSwitch } from '@/components/ui';
import { BrandArt } from '@/features/onboarding/art';
import { useI18n } from '@/i18n';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/theme';

const COUNT = 4;
// The onboarding hero keeps the ocean brand colors in every theme.
const OCEAN = { from: brand.navyDeep, to: brand.navy, line: 'rgba(244,214,176,0.24)' };

// Four short slides on a deep brand hero with abstract panels, and an ivory
// sheet with the copy, a pager and one primary action.
export default function Onboarding() {
  const { c } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useSession();
  const { t, L, rtl } = useI18n();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const last = index === COUNT - 1;
  const slide = t.onboarding.slides[index];
  // Arabic moves forward when dragged to the right.
  const forwardSign = rtl ? 1 : -1;

  const go = (next: number) => setIndex(Math.max(0, Math.min(COUNT - 1, next)));
  // Called from the gesture worklet with a direction only, so it never reads
  // a stale slide index.
  const step = (dir: number) => setIndex((i) => Math.max(0, Math.min(COUNT - 1, i + dir)));
  const pan = usePanGesture({
    activeOffsetX: [-14, 14],
    failOffsetY: [-24, 24],
    onDeactivate: (e) => {
      'worklet';
      const dx = e.translationX * forwardSign;
      if (dx > 40) scheduleOnRN(step, 1);
      else if (dx < -40) scheduleOnRN(step, -1);
    },
  });

  const finish = (mode: 'signIn' | 'signUp') => {
    completeOnboarding();
    router.replace({ pathname: '/auth', params: { mode } });
  };

  const heroHeight = Math.max(420, Math.round(height * 0.66));

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.root, { direction: rtl ? 'rtl' : 'ltr', backgroundColor: c.bg }]}>
        <StatusBar style="light" />
        <HeroSurface colors={OCEAN} arcs={{ cx: width / 2, cy: heroHeight * 0.54 }} style={[styles.hero, { height: heroHeight, paddingTop: insets.top + 8 }]}>
          <View style={styles.topBar}>
            {!last ? (
              <PressableScale accessibilityRole="button" accessibilityLabel={t.common.skip} onPress={() => finish('signUp')} style={styles.skip}>
                <AppText weight="medium" size={14} color={brand.lightMuted}>
                  {t.common.skip}
                </AppText>
              </PressableScale>
            ) : (
              <View style={styles.skip} />
            )}
            <LangSwitch color={brand.ivory} border="rgba(255,255,255,0.12)" background="rgba(255,255,255,0.06)" />
          </View>
          <View style={styles.brand}>
            <Monogram size={52} colors={{ fill: brand.navy, ring: brand.peach }} />
            <AppText weight="bold" size={20} lineHeight={26} color={brand.ivory} style={styles.wordmark}>
              SQ AI
            </AppText>
            <AppText weight="medium" size={11} lineHeight={16} color={brand.lightMuted}>
              {L('التسويق الذكي للأعمال', 'Smart marketing for businesses')}
            </AppText>
          </View>
          <View style={styles.art}>
            <BrandArt width={Math.min(width, 430)} />
          </View>
        </HeroSurface>

        <View style={[styles.sheet, { backgroundColor: c.bg, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.pager}>
            {Array.from({ length: COUNT }, (_, i) => (
              <PressableScale
                key={i}
                accessibilityRole="button"
                accessibilityLabel={L(`الشريحة ${i + 1}`, `Slide ${i + 1}`)}
                accessibilityState={{ selected: i === index }}
                onPress={() => go(i)}
                haptic={false}
                style={styles.dotHit}>
                <View style={[styles.dot, i === index ? { width: 22, backgroundColor: c.primary } : { width: 8, backgroundColor: c.lineStrong, opacity: 0.5 }]} />
              </PressableScale>
            ))}
            <View style={styles.flex} />
            <AppText weight="medium" size={11} lineHeight={16} color={c.placeholder} style={styles.count}>
              {`${index + 1} / ${COUNT}`}
            </AppText>
          </View>
          <Animated.View key={index} entering={reduceMotion ? undefined : FadeIn.duration(240)} style={styles.copy} accessibilityLiveRegion="polite">
            <AppText variant="h1" accessibilityRole="header">
              {slide.title}
            </AppText>
            <AppText variant="body" color={c.muted}>
              {slide.body}
            </AppText>
          </Animated.View>
          <Button label={last ? L('ابدأ الآن', 'Get started') : t.common.next} icon="arrow" iconEnd onPress={() => (last ? finish('signUp') : go(index + 1))} />
          <PressableScale accessibilityRole="button" onPress={() => finish('signIn')} style={styles.signIn} haptic={false}>
            <AppText variant="body" color={c.muted} center>
              {L('لديك حساب؟ ', 'Have an account? ')}
              <AppText variant="body" weight="semibold">
                {L('سجّل الدخول', 'Sign in')}
              </AppText>
            </AppText>
          </PressableScale>
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  hero: {},
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  skip: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
  brand: { alignItems: 'center', gap: 10, marginTop: 8 },
  wordmark: { letterSpacing: 1.5, writingDirection: 'ltr', marginBottom: -8 },
  art: { position: 'absolute', left: 0, right: 0, bottom: 4, alignItems: 'center' },
  sheet: {
    flex: 1,
    marginTop: -40,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: 22,
    paddingHorizontal: 24,
    gap: 18,
  },
  pager: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dotHit: { height: 24, justifyContent: 'center' },
  dot: { height: 4, borderRadius: 2 },
  flex: { flex: 1 },
  count: { writingDirection: 'ltr' },
  copy: { gap: 6, flexGrow: 1 },
  signIn: { minHeight: 40, justifyContent: 'center' },
});
