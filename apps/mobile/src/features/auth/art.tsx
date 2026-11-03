// Brand art for the sign-in screens: the glow and stacked pills of the night
// look, and the geometric panel of the day look, in each palette's colors.

import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import type { PaletteName } from '@sq/shared';
import { AppText } from '@/components/AppText';

export type Art = {
  deep: string;
  panel: string;
  mid: string;
  slate: string;
  glowA: string;
  glowB: string;
  light: string;
  muted: string;
  // Lines, focus rings and links on the dark surfaces.
  accent: string;
  pills: { bg: string; fg: string }[];
  finalPill: { bg: string; fg: string };
  swatches: string[];
};

export const arts: Record<PaletteName, Art> = {
  ocean: {
    deep: '#0B132B',
    panel: '#1C2541',
    mid: '#24304F',
    slate: '#3A506B',
    glowA: '#D97706',
    glowB: '#5BC0DE',
    light: '#F1F5F9',
    muted: '#A9B8CC',
    accent: '#5BC0DE',
    pills: [
      { bg: '#1C2541', fg: '#A9B8CC' },
      { bg: '#24304F', fg: '#C4CFDE' },
      { bg: '#3A506B', fg: '#F1F5F9' },
      { bg: '#5BC0DE', fg: '#0B132B' },
      { bg: '#F4D6B0', fg: '#0B132B' },
    ],
    finalPill: { bg: '#D97706', fg: '#0B132B' },
    swatches: ['#1C2541', '#3A506B', '#5BC0DE', '#F4D6B0', '#D97706'],
  },
  rose: {
    deep: '#121212',
    panel: '#1F2937',
    mid: '#2A3441',
    slate: '#334155',
    glowA: '#EC4899',
    glowB: '#647488',
    light: '#F1F5F9',
    muted: '#A7B2C2',
    accent: '#EC4899',
    pills: [
      { bg: '#1F2937', fg: '#A7B2C2' },
      { bg: '#2A3441', fg: '#C6CEDA' },
      { bg: '#334155', fg: '#F1F5F9' },
      { bg: '#647488', fg: '#FFFFFF' },
      { bg: '#F1F5F9', fg: '#121212' },
    ],
    finalPill: { bg: '#EC4899', fg: '#121212' },
    swatches: ['#1F2937', '#334155', '#647488', '#F1F5F9', '#EC4899'],
  },
};

// A soft radial light, drawn with SVG so it looks the same on every platform.
export function Glow({ color, size, style, id, strength = 0.75 }: { color: string; size: number; style: StyleProp<ViewStyle>; id: string; strength?: number }) {
  const r = size / 2;
  return (
    <View pointerEvents="none" style={[styles.abs, { width: size, height: size }, style]}>
      <Svg width={size} height={size} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={strength} />
            <Stop offset="0.4" stopColor={color} stopOpacity={strength * 0.3} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

const steps = ['خطة الشهر', 'تصوير موجّه', 'مونتاج بالذكاء الاصطناعي', 'نشر في أفضل وقت', 'رد تلقائي على الزبائن'];

// Overlapping pills, one per step of the work, ending in the result.
export function PillStack({ art, result, figure }: { art: Art; result: string; figure: string }) {
  return (
    <View style={styles.stack} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {art.pills.map((p, i) => (
        <View key={steps[i]} style={[styles.pill, { backgroundColor: p.bg, zIndex: i + 1, marginTop: i === 0 ? 0 : -24 }]}>
          <AppText size={11} lineHeight={16} color={p.fg}>
            {steps[i]}
          </AppText>
        </View>
      ))}
      <View style={[styles.pill, styles.finalPill, { backgroundColor: art.finalPill.bg, zIndex: 9 }]}>
        <AppText weight="semibold" size={12} color={art.finalPill.fg}>
          {result}
        </AppText>
        <AppText weight="semibold" size={12} color={art.finalPill.fg}>
          {figure}
        </AppText>
      </View>
    </View>
  );
}

export function PaletteBar({ art }: { art: Art }) {
  return (
    <View style={styles.bar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {art.swatches.map((s, i) => (
        <View key={s} style={[styles.barPart, { backgroundColor: s, flex: i === art.swatches.length - 1 ? 1.6 : 1 }]} />
      ))}
    </View>
  );
}

// Day look: circles and pills on the dark top panel.
export function DayShapes({ art, compact }: { art: Art; compact?: boolean }) {
  const k = compact ? 0.62 : 1;
  const pillA = art.swatches[2];
  const pillB = art.swatches[3];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.ring, { width: 420 * k, height: 420 * k, borderRadius: 210 * k, left: -150 * k, top: -170 * k, borderColor: `${art.accent}40` }]} />
      <View style={[styles.ring, { width: 300 * k, height: 300 * k, borderRadius: 150 * k, left: -90 * k, top: -110 * k, borderColor: `${art.accent}59` }]} />
      <View style={[styles.abs, { width: 180 * k, height: 180 * k, borderRadius: 90 * k, left: -30 * k, top: -50 * k, backgroundColor: art.slate }]} />
      <Glow id={compact ? 'dayGlowS' : 'dayGlow'} color={art.glowA} size={190 * k} style={{ left: 45 * k, top: 49 * k }} strength={0.6} />
      <View style={[styles.abs, { width: 96 * k, height: 96 * k, borderRadius: 48 * k, left: 92 * k, top: 96 * k, backgroundColor: art.glowA }]} />
      <View style={[styles.abs, styles.dayPill, { width: 150 * k, height: 44 * k, borderRadius: 22 * k, right: -20, top: 70 * k, backgroundColor: pillA }]} />
      <View style={[styles.abs, styles.dayPill, { width: 110 * k, height: 44 * k, borderRadius: 22 * k, right: 40 * k, top: 124 * k, backgroundColor: pillB }]} />
      {!compact && <View style={[styles.abs, { width: 70, height: 44, borderRadius: 22, right: 160, top: 178, backgroundColor: art.deep, borderWidth: 1, borderColor: art.slate }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  ltr: { writingDirection: 'ltr' },
  stack: { width: 250, alignSelf: 'center' },
  pill: {
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 9,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  finalPill: { height: 64, borderRadius: 32, marginTop: -24, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  bar: { flexDirection: 'row', gap: 6, direction: 'ltr' },
  barPart: { height: 10, borderRadius: 5 },
  ring: { position: 'absolute', borderWidth: 1 },
  dayPill: {},
});
