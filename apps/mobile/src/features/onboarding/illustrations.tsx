import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { brand, formatNumber } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { ar } from '@/i18n/ar';

const copy = ar.onboarding.illustrations;

type ArtProps = { active: boolean };

// 1. Guided camera: a viewfinder with thirds and a product frame; the
// "ready" status appears once the plate sits inside the frame.
export function CameraArt({ active }: ArtProps) {
  const reduceMotion = useReducedMotion();
  const pop = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!active || reduceMotion) return;
    pop.set(withRepeat(withSequence(withDelay(800, withTiming(1, { duration: 220 })), withDelay(1800, withTiming(0, { duration: 200 }))), -1));
    return () => cancelAnimation(pop);
  }, [active, reduceMotion, pop]);

  const status = useAnimatedStyle(() => ({ opacity: pop.value, transform: [{ translateY: (1 - pop.value) * 6 }] }));

  return (
    <View style={styles.stage}>
      <View style={[styles.phone, { borderColor: brand.tealLine, backgroundColor: brand.teal }]}>
        <View style={[styles.gridV, { left: '33.3%' }]} />
        <View style={[styles.gridV, { left: '66.6%' }]} />
        <View style={[styles.gridH, { top: '33.3%' }]} />
        <View style={[styles.gridH, { top: '66.6%' }]} />
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
          <View style={[styles.plate, { borderColor: brand.creamOnTeal }]}>
            <View style={[styles.plateInner, { backgroundColor: brand.greenBrand }]} />
          </View>
        </View>
        <Animated.View style={[styles.ready, status]}>
          <View style={[styles.readyDot, { backgroundColor: brand.greenLight }]} />
          <AppText size={11.5} color={brand.cream}>
            {copy.plate}
          </AppText>
        </Animated.View>
        <View style={[styles.rec, { borderColor: brand.cream }]}>
          <View style={styles.recInner} />
        </View>
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
          withDelay(500 + order * 450, withTiming(1, { duration: 220 })),
          withDelay(1800 - order * 450, withTiming(0, { duration: 250 })),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(lit);
  }, [active, reduceMotion, order, lit]);

  const chip = useAnimatedStyle(() => ({ opacity: 0.5 + 0.5 * lit.value }));
  const tick = useAnimatedStyle(() => ({ opacity: lit.value }));

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
    float.set(withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }), -1, true));
    return () => cancelAnimation(float);
  }, [active, reduceMotion, float]);

  const reel = useAnimatedStyle(() => ({ transform: [{ translateY: -4 * float.value }] }));

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

  const enter = reduceMotion ? undefined : FadeIn.duration(220);
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
        <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(220)} style={[styles.order, { backgroundColor: brand.green }]}>
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

const C = 18;
const styles = StyleSheet.create({
  stage: { height: 300, alignItems: 'center', justifyContent: 'center' },
  phone: { width: 180, height: 270, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(244,237,231,0.16)' },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(244,237,231,0.16)' },
  frame: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: C, height: C, borderColor: brand.sand },
  tl: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  tr: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  br: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  plate: { width: 84, height: 84, borderRadius: 42, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  plateInner: { width: 54, height: 54, borderRadius: 27 },
  ready: { position: 'absolute', top: 14, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  readyDot: { width: 6, height: 6, borderRadius: 3 },
  rec: { position: 'absolute', bottom: 16, width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  recInner: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#D9443A' },
  reel: { width: 100, height: 170, borderRadius: 12, padding: 12, justifyContent: 'flex-end', gap: 6, alignItems: 'center' },
  play: { position: 'absolute', top: 58, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  reelBar: { alignSelf: 'stretch', height: 5, borderRadius: 2 },
  reelBarShort: { width: '60%', alignSelf: 'flex-start' },
  platformRow: { flexDirection: 'row', gap: 8, marginTop: 24 },
  platform: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tick: { position: 'absolute', top: -7, end: -7, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  chat: { alignItems: 'stretch', justifyContent: 'flex-end', gap: 8, paddingHorizontal: 8 },
  bubble: { maxWidth: '82%', paddingHorizontal: 12, paddingVertical: 9 },
  bubbleIn: { alignSelf: 'flex-start', borderRadius: 14, borderBottomEndRadius: 4 },
  bubbleOut: { alignSelf: 'flex-end', borderRadius: 14, borderBottomStartRadius: 4 },
  order: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginTop: 6 },
  costCard: { width: 260, borderRadius: 14, padding: 18, gap: 4, borderWidth: 1, borderColor: brand.tealLine },
  tabular: { fontVariant: ['tabular-nums'] },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 100, marginTop: 10 },
  bar: { flex: 1, borderRadius: 3 },
});
