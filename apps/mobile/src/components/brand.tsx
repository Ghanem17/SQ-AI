// Brand graphics from the formal redesign: the SQ monogram, the hero surface
// with its hairline grid and concentric arcs, and the receipt's success seal.
// Abstract shapes only; no faces, no emoji.

import { useId, useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { brand, font } from '@sq/shared';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';

// A rounded square in the hero color with an inset champagne ring, "SQ" and
// a short underline. On a hero it uses heroAlt so it stands apart.
export function Monogram({ size = 38, onHero = false, colors }: { size?: number; onHero?: boolean; colors?: { fill: string; ring: string } }) {
  const { c } = useTheme();
  const r = Math.round(size * 0.28);
  const fill = colors?.fill ?? (onHero ? c.heroAlt : c.hero);
  const ring = colors?.ring ?? c.heroAccent;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} accessibilityLabel="SQ AI" accessibilityRole="image">
      <Rect width={size} height={size} rx={r} fill={fill} />
      <Rect x={3.5} y={3.5} width={size - 7} height={size - 7} rx={r - 3} fill="none" stroke={ring} strokeOpacity={0.55} strokeWidth={1} />
      <SvgText
        x={size / 2}
        y={size * 0.53 + size * 0.13}
        textAnchor="middle"
        fontFamily={font.bold}
        fontSize={Math.round(size * 0.36)}
        letterSpacing={0.6}
        fill={brand.ivory}>
        SQ
      </SvgText>
      <Rect x={size / 2 - size * 0.12} y={size * 0.74} width={size * 0.24} height={1.4} rx={0.7} fill={ring} />
    </Svg>
  );
}

// The hairline grid and five concentric arcs. The arcs sit near the top end
// corner (left in Arabic) unless a centre is given.
export function HeroPattern({ width, height, cx, cy = 40, line }: { width: number; height: number; cx?: number; cy?: number; line?: string }) {
  const { c } = useTheme();
  const { rtl } = useI18n();
  const x0 = cx ?? (rtl ? 30 : width - 30);
  const grid: string[] = [];
  for (let x = 0; x <= width; x += 24) grid.push(`M${x} 0V${height}`);
  for (let y = 0; y <= height; y += 24) grid.push(`M0 ${y}H${width}`);
  return (
    <Svg width={width} height={height} style={styles.fill} pointerEvents="none">
      <Path d={grid.join('')} stroke="#FFFFFF" strokeOpacity={0.035} strokeWidth={1} />
      <G>
        {[70, 120, 170, 220, 270].map((r, i) => (
          <Circle key={r} cx={x0} cy={cy} r={r} fill="none" stroke={line ?? c.heroLine} strokeWidth={1} strokeOpacity={0.9 - i * 0.15} />
        ))}
      </G>
    </Svg>
  );
}

// A deep surface: a 165° gradient from hero to heroAlt, with the pattern.
export function HeroSurface({
  children,
  style,
  arcs,
  colors,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  // Arc centre: an absolute x, or an inset from the end edge (so it mirrors
  // with the reading direction).
  arcs?: { cx?: number; endInset?: number; cy?: number };
  // Brand surfaces such as onboarding keep the ocean colors in every theme.
  colors?: { from: string; to: string; line: string };
}) {
  const { c } = useTheme();
  const { rtl } = useI18n();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const gradId = `hero${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const from = colors?.from ?? c.hero;
  const to = colors?.to ?? c.heroAlt;
  return (
    <View
      style={[styles.hero, { backgroundColor: from }, style]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (Math.abs(width - size.w) > 0.5 || Math.abs(height - size.h) > 0.5) setSize({ w: width, h: height });
      }}>
      {size.w > 0 && (
        <>
          <Svg width={size.w} height={size.h} style={styles.fill} pointerEvents="none">
            <Defs>
              <LinearGradient id={gradId} x1="0.37" y1="0" x2="0.63" y2="1">
                <Stop offset="0" stopColor={from} />
                <Stop offset="1" stopColor={to} />
              </LinearGradient>
            </Defs>
            <Rect width={size.w} height={size.h} fill={`url(#${gradId})`} />
          </Svg>
          <HeroPattern
            width={size.w}
            height={size.h}
            cx={arcs?.cx ?? (arcs?.endInset !== undefined ? (rtl ? arcs.endInset : size.w - arcs.endInset) : undefined)}
            cy={arcs?.cy}
            line={colors?.line}
          />
        </>
      )}
      {children}
    </View>
  );
}

// The receipt's seal: an outer hairline ring, a hero disc, an inset accent
// ring and a check.
export function SuccessSeal({ size = 68 }: { size?: number }) {
  const { c } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 76 76" accessibilityElementsHidden importantForAccessibility="no">
      <Circle cx={38} cy={38} r={37} fill="none" stroke={c.line} />
      <Circle cx={38} cy={38} r={30} fill={c.hero} />
      <Circle cx={38} cy={38} r={25.5} fill="none" stroke={c.heroAccent} strokeOpacity={0.5} />
      <Path d="M28 38.5l7 7 13.5-14" fill="none" stroke={c.heroAccent} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Iraq's flag as three bars, for the phone field's country box.
export function IraqFlag() {
  return (
    <Svg width={22} height={15} viewBox="0 0 22 15" accessibilityElementsHidden importantForAccessibility="no">
      <Rect width={22} height={5} fill="#9E3B2F" />
      <Rect y={5} width={22} height={5} fill="#FFFFFF" />
      <Rect y={10} width={22} height={5} fill="#0B132B" />
      <Rect x={0.5} y={0.5} width={21} height={14} rx={1.5} fill="none" stroke="rgba(0,0,0,0.12)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  hero: { overflow: 'hidden' },
  fill: { position: 'absolute', top: 0, left: 0 },
});
