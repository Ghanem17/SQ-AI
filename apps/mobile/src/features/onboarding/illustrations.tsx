import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { brand, formatNumber } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { ar } from '@/i18n/ar';

const copy = ar.onboarding.illustrations;

type ArtProps = { active: boolean };

// 1. Guided camera: the dashed guide turns around the plate and a check pops in.
export function CameraArt({ active }: ArtProps) {
  const reduceMotion = useReducedMotion();
  const spin = useSharedValue(0);
  const pop = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!active || reduceMotion) return;
    spin.set(withRepeat(withTiming(360, { duration: 9000, easing: Easing.linear }), -1));
    pop.set(
      withRepeat(
        withSequence(withDelay(700, withSpring(1, { damping: 9, stiffness: 180 })), withDelay(1600, withTiming(0, { duration: 200 }))),
        -1,
      ),
    );
    return () => {
      cancelAnimation(spin);
      cancelAnimation(pop);
    };
  }, [active, reduceMotion, spin, pop]);

  const guide = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const check = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }], opacity: pop.value }));

  return (
    <View style={styles.stage}>
      <View style={[styles.phone, { borderColor: brand.cream }]}>
        <Animated.View style={[styles.guide, { borderColor: brand.sand }, guide]} />
        <View style={[styles.plate, { backgroundColor: brand.cream }]}>
          <View style={[styles.plateRing, { borderColor: brand.sand }]}>
            <View style={styles.rolls}>
              {Array.from({ length: 6 }, (_, i) => (
                <View key={i} style={[styles.roll, { backgroundColor: i % 2 ? brand.green : brand.greenBrand }]} />
              ))}
            </View>
          </View>
        </View>
        <View style={[styles.level, { backgroundColor: brand.greenLight }]} />
        <Animated.View style={[styles.check, { backgroundColor: brand.greenLight }, check]}>
          <Icon name="check" color={brand.ink} size={22} strokeWidth={3} />
        </Animated.View>
      </View>
    </View>
  );
}

// 2. Publishing: the reel floats while each platform lights up in turn.
const platforms = ['إنستغرام', 'فيسبوك', 'تيك توك'];

function PlatformChip({ name, order, active }: { name: string; order: number; active: boolean }) {
  const reduceMotion = useReducedMotion();
  const lit = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!active || reduceMotion) return;
    lit.set(0);
    lit.set(
      withRepeat(
        withSequence(
          withDelay(500 + order * 450, withSpring(1, { damping: 10 })),
          withDelay(1800 - order * 450, withTiming(0, { duration: 250 })),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(lit);
  }, [active, reduceMotion, order, lit]);

  const chip = useAnimatedStyle(() => ({ transform: [{ scale: 0.9 + 0.1 * lit.value }], opacity: 0.55 + 0.45 * lit.value }));
  const tick = useAnimatedStyle(() => ({ transform: [{ scale: lit.value }] }));

  return (
    <Animated.View style={[styles.platform, { backgroundColor: brand.teal }, chip]}>
      <AppText weight="semibold" size={13} color={brand.cream}>
        {name}
      </AppText>
      <Animated.View style={[styles.tick, { backgroundColor: brand.sand }, tick]}>
        <Icon name="check" color={brand.ink} size={12} strokeWidth={3} />
      </Animated.View>
    </Animated.View>
  );
}

export function PublishArt({ active }: ArtProps) {
  const reduceMotion = useReducedMotion();
  const float = useSharedValue(0);

  useEffect(() => {
    if (!active || reduceMotion) return;
    float.set(withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, true));
    return () => cancelAnimation(float);
  }, [active, reduceMotion, float]);

  const reel = useAnimatedStyle(() => ({ transform: [{ translateY: -10 * float.value }] }));

  return (
    <View style={styles.stage}>
      <Animated.View style={[styles.reel, { backgroundColor: brand.teal }, reel]}>
        <View style={[styles.play, { backgroundColor: brand.cream }]}>
          <Icon name="play" color={brand.teal} size={20} />
        </View>
        <View style={[styles.reelBar, { backgroundColor: brand.sand }]} />
        <View style={[styles.reelBar, styles.reelBarShort, { backgroundColor: brand.tealLine }]} />
      </Animated.View>
      <View style={styles.platformRow}>
        {platforms.map((name, i) => (
          <PlatformChip key={name} name={name} order={i} active={active} />
        ))}
      </View>
    </View>
  );
}

// 3. Replies: a short conversation plays out and ends in an order.
export function ChatArt({ active }: ArtProps) {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const playing = active && !reduceMotion;
  // Off-screen or with reduced motion, the finished conversation shows as is.
  const shown = playing ? step : 4;

  useEffect(() => {
    if (!playing) return;
    let current = 0;
    const timer = setInterval(() => {
      current = current >= 6 ? 0 : current + 1;
      setStep(Math.min(current, 4));
    }, 900);
    return () => {
      clearInterval(timer);
      setStep(0);
    };
  }, [playing]);

  const enter = reduceMotion ? undefined : FadeInDown.springify().damping(14);
  return (
    <View style={[styles.stage, styles.chat]}>
      {shown >= 1 && (
        <Animated.View entering={enter} style={[styles.bubble, styles.bubbleIn, { backgroundColor: brand.cream }]}>
          <AppText size={14} color={brand.ink}>
            {copy.customerAsk}
          </AppText>
        </Animated.View>
      )}
      {shown >= 2 && (
        <Animated.View entering={enter} style={[styles.bubble, styles.bubbleOut, { backgroundColor: brand.teal }]}>
          <AppText size={14} color={brand.cream}>
            {copy.assistantAnswer}
          </AppText>
        </Animated.View>
      )}
      {shown >= 3 && (
        <Animated.View entering={enter} style={[styles.bubble, styles.bubbleIn, { backgroundColor: brand.cream }]}>
          <AppText size={14} color={brand.ink}>
            {copy.customerOrder}
          </AppText>
        </Animated.View>
      )}
      {shown >= 4 && (
        <Animated.View entering={reduceMotion ? undefined : FadeInDown.springify().damping(9)} style={[styles.order, { backgroundColor: brand.green }]}>
          <Icon name="check" color={brand.cream} size={16} strokeWidth={3} />
          <AppText weight="semibold" size={14} color={brand.cream}>
            {copy.newOrder}
          </AppText>
        </Animated.View>
      )}
    </View>
  );
}

// 4. Cost per order: the number counts down while the bars shrink.
const FROM = 2900;
const TO = 2100;
const BAR_HEIGHTS = [96, 86, 76, 68];

export function CostArt({ active }: ArtProps) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(FROM);
  const grow = useSharedValue(0);
  const playing = active && !reduceMotion;
  const shown = playing ? value : TO;

  useEffect(() => {
    if (!playing) {
      grow.set(1);
      return;
    }
    grow.set(0);
    grow.set(withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) }));
    const started = Date.now();
    const timer = setInterval(() => {
      const t = Math.min(1, (Date.now() - started) / 1600);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round((FROM - (FROM - TO) * eased) / 10) * 10);
      if (t >= 1) clearInterval(timer);
    }, 40);
    return () => {
      clearInterval(timer);
      setValue(FROM);
    };
  }, [playing, grow]);

  return (
    <View style={styles.stage}>
      <View style={[styles.costCard, { backgroundColor: brand.teal }]}>
        <AppText size={13} color={brand.creamOnDeep}>
          {copy.costLabel}
        </AppText>
        <AppText weight="bold" size={44} lineHeight={52} color={brand.cream} style={styles.tabular}>
          {formatNumber(shown)}
        </AppText>
        <View style={styles.bars}>
          {BAR_HEIGHTS.map((h, i) => (
            <Bar key={h} height={h} grow={grow} highlight={i === BAR_HEIGHTS.length - 1} />
          ))}
        </View>
      </View>
    </View>
  );
}

function Bar({ height, grow, highlight }: { height: number; grow: SharedValue<number>; highlight: boolean }) {
  const style = useAnimatedStyle(() => ({ height: 12 + (height - 12) * grow.value }));
  return <Animated.View style={[styles.bar, { backgroundColor: highlight ? brand.sand : brand.thumb }, style]} />;
}

const styles = StyleSheet.create({
  stage: { height: 300, alignItems: 'center', justifyContent: 'center' },
  phone: { width: 190, height: 260, borderRadius: 34, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  guide: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 2, borderStyle: 'dashed' },
  plate: { width: 118, height: 118, borderRadius: 59, alignItems: 'center', justifyContent: 'center' },
  plateRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  rolls: { flexDirection: 'row', flexWrap: 'wrap', width: 66, gap: 5, justifyContent: 'center' },
  roll: { width: 18, height: 28, borderRadius: 9 },
  level: { position: 'absolute', bottom: 36, width: 120, height: 3, borderRadius: 2 },
  check: { position: 'absolute', top: 18, end: 18, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  reel: { width: 96, height: 160, borderRadius: 22, padding: 12, justifyContent: 'flex-end', gap: 6, alignItems: 'center' },
  play: { position: 'absolute', top: 50, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  reelBar: { alignSelf: 'stretch', height: 6, borderRadius: 3 },
  reelBarShort: { width: '60%', alignSelf: 'flex-start' },
  platformRow: { flexDirection: 'row', gap: 10, marginTop: 26 },
  platform: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, alignItems: 'center' },
  tick: { position: 'absolute', top: -8, end: -8, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  chat: { alignItems: 'stretch', justifyContent: 'flex-end', gap: 8, paddingHorizontal: 8 },
  bubble: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10 },
  bubbleIn: { alignSelf: 'flex-start', borderRadius: 20, borderBottomEndRadius: 6 },
  bubbleOut: { alignSelf: 'flex-end', borderRadius: 20, borderBottomStartRadius: 6 },
  order: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, marginTop: 6 },
  costCard: { width: 260, borderRadius: 28, padding: 20, gap: 4 },
  tabular: { fontVariant: ['tabular-nums'] },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 100, marginTop: 10 },
  bar: { flex: 1, borderRadius: 10 },
});
