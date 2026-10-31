import { router } from 'expo-router';
import { useState, type ComponentType } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { brand } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PressableScale } from '@/components/PressableScale';
import { CameraArt, ChatArt, CostArt, PublishArt } from '@/features/onboarding/illustrations';
import { ar } from '@/i18n/ar';
import { useSession } from '@/state/session';

type Slide = {
  bg: string;
  fg: string;
  muted: string;
  buttonBg: string;
  buttonFg: string;
  Art: ComponentType<{ active: boolean }>;
};

// One calm brand surface for every slide, the same in light and dark mode.
const deep = { bg: brand.tealDeep, fg: brand.cream, muted: brand.creamOnDeep, buttonBg: brand.sand, buttonFg: brand.ink };
const slides: Slide[] = [
  { ...deep, Art: CameraArt },
  { ...deep, Art: PublishArt },
  { ...deep, Art: ChatArt },
  { ...deep, Art: CostArt },
];

const LAST = slides.length - 1;
// Plain arrays for the UI thread: worklets cannot call JS callbacks or capture
// the slide objects, which hold React components.
const SLIDE_STOPS = slides.map((_, i) => i);
const SLIDE_COLORS = slides.map((s) => s.bg);
const SPRING = { damping: 20, stiffness: 160, mass: 0.9 };

function rubberBand(value: number) {
  'worklet';
  if (value < 0) return value * 0.3;
  if (value > LAST) return LAST + (value - LAST) * 0.3;
  return value;
}

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const { completeOnboarding } = useSession();
  const reduceMotion = useReducedMotion();
  const position = useSharedValue(0);
  const start = useSharedValue(0);
  const [index, setIndex] = useState(0);

  const settle = (target: number) => {
    position.set(reduceMotion ? withTiming(target, { duration: 0 }) : withSpring(target, SPRING));
    setIndex(target);
  };

  // RTL: the next slide waits on the left, so dragging to the right moves forward.
  const pan = usePanGesture({
    activeOffsetX: [-12, 12],
    failOffsetY: [-24, 24],
    onBegin: () => {
      'worklet';
      start.value = position.value;
    },
    onUpdate: (e) => {
      'worklet';
      position.value = rubberBand(start.value + e.translationX / width);
    },
    onDeactivate: (e) => {
      'worklet';
      const projected = position.value + (e.velocityX / width) * 0.25;
      const target = Math.max(0, Math.min(LAST, Math.round(projected)));
      position.value = withSpring(target, SPRING);
      scheduleOnRN(setIndex, target);
    },
  });

  const finish = () => {
    completeOnboarding();
    router.replace('/auth');
  };

  const background = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(position.value, SLIDE_STOPS, SLIDE_COLORS),
  }));

  const slide = slides[index];

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, background]} />
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          {index < LAST ? (
            <PressableScale accessibilityRole="button" accessibilityLabel={ar.common.skip} onPress={finish} style={styles.skip}>
              <AppText weight="medium" size={15} color={slide.fg}>
                {ar.common.skip}
              </AppText>
            </PressableScale>
          ) : (
            <View style={styles.skip} />
          )}
        </View>

        <GestureDetector gesture={pan}>
          <View style={styles.pager} accessibilityRole="adjustable" accessibilityLabel={ar.onboarding.slides[index].title}>
            {slides.map((s, i) => (
              <SlideView key={i} index={i} slide={s} position={position} width={width} active={i === index} />
            ))}
          </View>
        </GestureDetector>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {slides.map((s, i) => (
              <Dot key={i} index={i} position={position} color={slide.fg} />
            ))}
          </View>
          <Button
            label={index === LAST ? ar.common.start : ar.common.next}
            colors={{ bg: slide.buttonBg, fg: slide.buttonFg }}
            onPress={() => (index === LAST ? finish() : settle(index + 1))}
            style={styles.next}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function SlideView({
  index,
  slide,
  position,
  width,
  active,
}: {
  index: number;
  slide: Slide;
  position: SharedValue<number>;
  width: number;
  active: boolean;
}) {
  const copy = ar.onboarding.slides[index];
  const page = useAnimatedStyle(() => ({ transform: [{ translateX: (position.value - index) * width }] }));
  // The illustration lags behind the text for a little depth.
  const art = useAnimatedStyle(() => ({
    transform: [{ translateX: (position.value - index) * width * 0.35 }],
    opacity: interpolate(Math.abs(position.value - index), [0, 0.8], [1, 0], 'clamp'),
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.slide, page]} importantForAccessibility={active ? 'yes' : 'no-hide-descendants'}>
      <Animated.View style={art}>
        <slide.Art active={active} />
      </Animated.View>
      <View style={styles.text}>
        <AppText weight="semibold" size={26} lineHeight={36} color={slide.fg} center>
          {copy.title}
        </AppText>
        <AppText size={15} lineHeight={25} color={slide.muted} center>
          {copy.body}
        </AppText>
      </View>
    </Animated.View>
  );
}

function Dot({ index, position, color }: { index: number; position: SharedValue<number>; color: string }) {
  const style = useAnimatedStyle(() => {
    const d = Math.min(1, Math.abs(position.value - index));
    return { width: 22 - 14 * d, opacity: 1 - 0.6 * d };
  });
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, direction: 'rtl' },
  topBar: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8 },
  skip: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
  pager: { flex: 1, overflow: 'hidden' },
  slide: { justifyContent: 'center', paddingHorizontal: 28, gap: 24 },
  text: { gap: 10 },
  footer: { paddingHorizontal: 24, paddingBottom: 12, gap: 22 },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: { height: 4, borderRadius: 2 },
  next: { alignSelf: 'stretch' },
});
