// "Why this price?" as one row: the number of tools, what they cost and the
// service fee. Tapping it lists every tool, its task and its cost.

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatIQD, serviceTools, type Quote } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Card, Divider } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';

export function WhyPrice({ quote: q, open, onToggle }: { quote: Quote; open?: boolean; onToggle?: () => void }) {
  const { c } = useTheme();
  const { L, pick, n } = useI18n();
  const [own, setOwn] = useState(false);
  const expanded = open ?? own;
  return (
    <Card style={styles.card}>
      <PressableScale
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={L('لماذا هذا السعر؟', 'Why this price?')}
        onPress={onToggle ?? (() => setOwn((v) => !v))}
        pressedScale={1}
        style={styles.row}>
        <View style={styles.flex}>
          <AppText variant="rowTitle">{L('لماذا هذا السعر؟', 'Why this price?')}</AppText>
          <AppText size={12.5} lineHeight={19} color={c.muted}>
            {L(
              `${n(q.lines.length, 'tool')} · تكلفة الأدوات ${formatIQD(q.toolsIqd)} · رسوم الخدمة ${formatIQD(q.feeIqd)}`,
              `${n(q.lines.length, 'tool')} · tools ${formatIQD(q.toolsIqd)} · service fee ${formatIQD(q.feeIqd)}`,
            )}
          </AppText>
        </View>
        <Icon name={expanded ? 'chevronUp' : 'chevronDown'} color={c.placeholder} size={18} />
      </PressableScale>
      {expanded && (
        <View style={[styles.lines, { borderTopColor: c.line }]}>
          {q.lines.map((l, i) => (
            <View key={`${l.tool}${i}`} style={styles.line}>
              <View style={styles.flex}>
                <AppText weight="semibold" size={13} lineHeight={19} style={styles.ltrStart}>
                  {serviceTools[l.tool].name}
                </AppText>
                <AppText size={12} lineHeight={17} color={c.muted}>
                  {pick(l.task)}
                </AppText>
              </View>
              <AppText size={12.5} lineHeight={18} weight="semibold">
                {formatIQD(l.costIqd)}
              </AppText>
            </View>
          ))}
          <Divider dashed style={styles.dash} />
          <View style={styles.line}>
            <View style={styles.flex}>
              <AppText weight="semibold" size={13} lineHeight={19}>
                {L('رسوم الخدمة', 'Service fee')}
              </AppText>
              <AppText size={12} lineHeight={17} color={c.muted}>
                {L('التجهيز والمراجعة والتخزين والدعم', 'Setup, review, storage and support')}
              </AppText>
            </View>
            <AppText size={12.5} lineHeight={18} weight="semibold">
              {formatIQD(q.feeIqd)}
            </AppText>
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { padding: 0, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  lines: { paddingHorizontal: 14, paddingBottom: 6, borderTopWidth: 1 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingVertical: 6 },
  ltrStart: { writingDirection: 'ltr', alignSelf: 'flex-start' },
  dash: { marginVertical: 2 },
});
