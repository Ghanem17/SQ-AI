import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { formatNumber, radius } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { useTheme } from '@/theme/theme';

// A line with a soft area under it. Time runs left to right, as in every
// finance app, regardless of the reading direction.
export function LineChart({ values, labels, height = 140, format = formatNumber }: { values: number[]; labels: string[]; height?: number; format?: (v: number) => string }) {
  const { c } = useTheme();
  const [width, setWidth] = useState(0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const padY = 12;
  const x = (i: number) => (values.length < 2 ? 0 : (i / (values.length - 1)) * width);
  const y = (v: number) => padY + (1 - (v - min) / span) * (height - padY * 2);
  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const last = values.length - 1;

  return (
    <View accessible accessibilityLabel={`من ${format(values[0])} إلى ${format(values[last])}`}>
      <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={c.chart} stopOpacity={0.16} />
                <Stop offset="1" stopColor={c.chart} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {[0.25, 0.5, 0.75].map((f) => (
              <Line key={f} x1={0} x2={width} y1={height * f} y2={height * f} stroke={c.line} strokeWidth={1} />
            ))}
            <Path d={area} fill="url(#area)" />
            <Path d={line} stroke={c.chart} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            <Circle cx={x(last)} cy={y(values[last])} r={4} fill={c.card} stroke={c.chart} strokeWidth={2} />
          </Svg>
        )}
      </View>
      <View style={styles.axis}>
        {labels.map((l) => (
          <AppText key={l} size={11} color={c.placeholder}>
            {l}
          </AppText>
        ))}
      </View>
    </View>
  );
}

// Ranked horizontal bars with the value at the end.
export function BarList({ items, format = formatNumber }: { items: { label: string; value: number; note?: string }[]; format?: (v: number) => string }) {
  const { c } = useTheme();
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <View style={styles.bars}>
      {items.map((item, i) => (
        <View key={item.label} style={styles.barRow}>
          <View style={styles.barHead}>
            <AppText size={13.5} weight="medium">
              {item.label}
            </AppText>
            <AppText size={13} color={c.muted} style={styles.tabular}>
              {format(item.value)}
              {item.note ? `  ·  ${item.note}` : ''}
            </AppText>
          </View>
          <View style={[styles.barTrack, { backgroundColor: c.track }]}>
            <View style={[styles.barFill, { width: `${(item.value / max) * 100}%`, backgroundColor: i === 0 ? c.chart : c.chartSoft }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

// Small column chart for compact cards.
export function Columns({ values, height = 44, highlightLast = true }: { values: number[]; height?: number; highlightLast?: boolean }) {
  const { c } = useTheme();
  const max = Math.max(...values, 1);
  return (
    <View style={[styles.columns, { height }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {values.map((v, i) => (
        <View
          key={i}
          style={[
            styles.column,
            { height: Math.max(3, (v / max) * height), backgroundColor: highlightLast && i === values.length - 1 ? c.chart : c.chartSoft },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, direction: 'ltr' },
  bars: { gap: 14 },
  barRow: { gap: 6 },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barTrack: { height: 6, borderRadius: radius.chip, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: radius.chip },
  columns: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, direction: 'ltr' },
  column: { flex: 1, borderRadius: 2 },
});
