import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { brand } from '@sq/shared';
import { useI18n } from '@/i18n';

// The onboarding art: three layered panels over the hero pattern — a navy
// chart panel, a glass panel with sky bars, and a small glass chip with a
// check. Skeleton bars only, no fake text or numbers. Time runs right to
// left in Arabic, so the whole composition mirrors in English.
export function BrandArt({ width }: { width: number }) {
  const { rtl } = useI18n();
  const scale = width / 390;
  return (
    <View style={[styles.wrap, { width, height: 300 * scale }, !rtl && styles.mirror]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={300 * scale} viewBox="0 0 390 300" fill="none">
        <Defs>
          <LinearGradient id="obArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={brand.sky} stopOpacity={0.28} />
            <Stop offset="1" stopColor={brand.sky} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <G transform="translate(232 22)">
          <Rect width={124} height={76} rx={12} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" />
          <Rect x={66} y={16} width={44} height={5} rx={2.5} fill="rgba(255,255,255,0.22)" />
          <G fill={brand.sky} transform="translate(124 0) scale(-1 1)">
            <Rect x={14} y={50} width={12} height={14} rx={2} opacity={0.45} />
            <Rect x={32} y={42} width={12} height={22} rx={2} opacity={0.6} />
            <Rect x={50} y={34} width={12} height={30} rx={2} opacity={0.8} />
            <Rect x={68} y={26} width={12} height={38} rx={2} />
          </G>
          <Rect x={14} y={16} width={22} height={5} rx={2.5} fill={brand.peach} opacity={0.9} />
        </G>
        <G transform="translate(70 92)">
          <Rect width={232} height={128} rx={16} fill={brand.navy} stroke="rgba(244,214,176,0.35)" />
          <Rect x={150} y={18} width={64} height={6} rx={3} fill="rgba(255,255,255,0.28)" />
          <Rect x={176} y={32} width={38} height={5} rx={2.5} fill="rgba(255,255,255,0.14)" />
          <Path d="M18 62H214M18 84H214M18 106H214" stroke="rgba(255,255,255,0.07)" />
          <G transform="translate(232 0) scale(-1 1)">
            <Path d="M18 100 C40 98 52 86 72 88 S104 74 124 76 S160 52 180 54 S204 40 214 38 V112 H18Z" fill="url(#obArea)" />
            <Path d="M18 100 C40 98 52 86 72 88 S104 74 124 76 S160 52 180 54 S204 40 214 38" stroke={brand.sky} strokeWidth={2.2} strokeLinecap="round" />
            <Path d="M180 60V112" stroke="rgba(244,214,176,0.45)" strokeDasharray="2 3" />
            <Circle cx={180} cy={54} r={5} fill={brand.orange} stroke={brand.navy} strokeWidth={2.5} />
          </G>
        </G>
        <G transform="translate(36 192)">
          <Rect width={132} height={58} rx={12} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
          <Circle cx={29} cy={29} r={13} fill="rgba(169,205,183,0.16)" />
          <Path d="M23 29.5l4 4 8-8" stroke={brand.sage} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Rect x={52} y={20} width={60} height={5} rx={2.5} fill="rgba(255,255,255,0.28)" />
          <Rect x={52} y={33} width={40} height={5} rx={2.5} fill="rgba(255,255,255,0.14)" />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center' },
  mirror: { transform: [{ scaleX: -1 }] },
});
