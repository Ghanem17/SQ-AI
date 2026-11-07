import { useId, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { font } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';

export type Series = {
  values: number[];
  // The main series is solid with an area; the second is dashed on its own scale.
  second?: boolean;
  min?: number;
  max?: number;
};

const PAD_X = 14;
const PAD_B = 24;

// Catmull-Rom smoothing with a low tension, as in the approved charts.
function smooth(pts: [number, number][]): string {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  const t = 0.18;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

// A smoothed line over a dashed grid with axis labels under each point. Time
// follows the reading direction, so in Arabic the oldest value is on the
// right. With no series it draws the grid and axis only, and `overlay`
// (an empty-state message) is centred over the plot.
export function LineChart({
  series = [],
  labels,
  height = 138,
  padTop = 30,
  active = -1,
  tip,
  overlay,
  summary,
}: {
  series?: Series[];
  labels: string[];
  height?: number;
  padTop?: number;
  active?: number;
  tip?: string;
  overlay?: ReactNode;
  // Read by screen readers in place of the drawing.
  summary?: string;
}) {
  const { c } = useTheme();
  const { rtl } = useI18n();
  const [width, setWidth] = useState(0);
  const gradId = `area${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const ih = height - padTop - PAD_B;
  const n = labels.length;
  // Wide enough that the end labels, centred under their points, stay inside.
  const padX = Math.max(PAD_X, Math.max(...labels.map((l) => l.length)) * 3);
  const step = n > 1 ? (width - padX * 2) / (n - 1) : 0;
  const X = (i: number) => (rtl ? width - padX - i * step : padX + i * step);
  const ticks = 4;

  return (
    <View accessible accessibilityLabel={summary} style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={c.chartSoft} stopOpacity={0.28} />
              <Stop offset="1" stopColor={c.chartSoft} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {Array.from({ length: ticks }, (_, k) => {
            const y = padTop + (ih / (ticks - 1)) * k;
            return <Path key={k} d={`M0 ${y}H${width}`} stroke={c.grid} strokeWidth={1} strokeDasharray={k === ticks - 1 ? undefined : '3 4'} />;
          })}
          {labels.map((l, i) => (
            <SvgText key={`${l}${i}`} x={X(i)} y={height - 6} textAnchor="middle" fontFamily={font.regular} fontSize={10.5} fill={c.placeholder}>
              {l}
            </SvgText>
          ))}
          {series.map((s, si) => {
            if (s.values.length < 2) return null;
            const mn = s.min ?? Math.min(...s.values);
            const mx = s.max ?? Math.max(...s.values);
            const Y = (v: number) => padTop + ih - ((v - mn) / (mx - mn || 1)) * ih * 0.86 - ih * 0.07;
            const pts = s.values.map((v, i) => [X(i), Y(v)] as [number, number]);
            const d = smooth(pts);
            const color = s.second ? c.chart2 : c.chart;
            const last = pts[pts.length - 1];
            return (
              <G key={si}>
                {!s.second && <Path d={`${d} L${last[0]} ${padTop + ih} L${pts[0][0]} ${padTop + ih}Z`} fill={`url(#${gradId})`} />}
                <Path d={d} fill="none" stroke={color} strokeWidth={s.second ? 1.6 : 2} strokeLinecap="round" strokeDasharray={s.second ? '4 4' : undefined} />
                {!s.second && pts.map((p, i) => (i === active ? null : <Circle key={i} cx={p[0]} cy={p[1]} r={2.6} fill={c.card} stroke={color} strokeWidth={1.6} />))}
                {!s.second && active >= 0 && active < pts.length && (
                  <ActivePoint x={pts[active][0]} y={pts[active][1]} base={padTop + ih} width={width} tip={tip} />
                )}
              </G>
            );
          })}
        </Svg>
      )}
      {overlay && <View style={[styles.overlay, { bottom: PAD_B }]}>{overlay}</View>}
    </View>
  );
}

function ActivePoint({ x, y, base, width, tip }: { x: number; y: number; base: number; width: number; tip?: string }) {
  const { c } = useTheme();
  const tw = tip ? tip.length * 6.2 + 20 : 0;
  const tx = Math.max(0, Math.min(width - tw, x - tw / 2));
  return (
    <G>
      <Path d={`M${x} ${y + 6}V${base}`} stroke={c.lineStrong} strokeWidth={1} strokeDasharray="2 3" />
      <Circle cx={x} cy={y} r={5.5} fill={c.accent} stroke={c.card} strokeWidth={2.5} />
      {tip && (
        <G>
          <Rect x={tx} y={y - 34} width={tw} height={24} rx={6} fill={c.tooltip} />
          <SvgText x={tx + tw / 2} y={y - 18} textAnchor="middle" fontFamily={font.semibold} fontSize={11.5} fill={c.onTooltip}>
            {tip}
          </SvgText>
        </G>
      )}
    </G>
  );
}

// The legend at the top end of a two-series chart.
export function Legend({ items }: { items: { label: string; second?: boolean }[] }) {
  const { c } = useTheme();
  return (
    <View style={styles.legend}>
      {items.map((it) => (
        <View key={it.label} style={styles.legendItem}>
          <View style={it.second ? [styles.swatchDash, { borderColor: c.chart2 }] : [styles.swatch, { backgroundColor: c.chart }]} />
          <AppText size={11} lineHeight={16} color={c.muted}>
            {it.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

// The hero's mini-bars: 10-wide bars with rising opacity; the selected
// period is in the hero accent. Empty periods show short stubs.
export function MiniBars({ values, selected, height = 64, empty }: { values: number[]; selected?: number; height?: number; empty?: boolean }) {
  const { c } = useTheme();
  const max = Math.max(...values, 1);
  return (
    <View style={[styles.bars, { height }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {values.map((v, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            empty
              ? { height: 8, backgroundColor: 'rgba(255,255,255,0.12)' }
              : {
                  height: Math.max(4, (v / max) * (height - 8)),
                  backgroundColor: i === selected ? c.heroAccent : c.chartSoft,
                  opacity: i === selected ? 1 : 0.55 + i * 0.08,
                },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  swatch: { width: 10, height: 2, borderRadius: 1 },
  swatchDash: { width: 10, height: 0, borderTopWidth: 2, borderStyle: 'dashed' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 9 },
  bar: { width: 10, borderRadius: 2 },
});
