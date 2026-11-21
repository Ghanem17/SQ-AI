// The three levels of one request, each with its headline model, what it
// gives and its price. Used for new orders and for changes to a result.

import { StyleSheet, View } from 'react-native';

import { formatIQD, levelModel, levelQuality, serviceTiers, tierNames, type Quote, type ServiceParams, type ServiceTier } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { ModelChip, RadioCard } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';

export function LevelPicker({ params, quotes, tier, onChange }: { params: ServiceParams; quotes: Record<ServiceTier, Quote>; tier: ServiceTier; onChange: (t: ServiceTier) => void }) {
  const { c } = useTheme();
  const { pick } = useI18n();
  return (
    <View accessibilityRole="radiogroup" style={styles.tiers}>
      {serviceTiers.map((tr) => (
        <RadioCard key={tr} selected={tr === tier} onPress={() => onChange(tr)} label={`${pick(tierNames[tr])}، ${levelModel(params, tr)}، ${formatIQD(quotes[tr].totalIqd)}`}>
          <View style={styles.tierHead}>
            <View style={styles.tierName}>
              <AppText variant="rowTitle">{pick(tierNames[tr])}</AppText>
              <ModelChip label={levelModel(params, tr)} />
            </View>
            <AppText weight="bold" size={15} lineHeight={22}>
              {formatIQD(quotes[tr].totalIqd)}
            </AppText>
          </View>
          <AppText variant="small" color={c.muted} numberOfLines={1} style={styles.tierQuality}>
            {pick(levelQuality(params, tr))}
          </AppText>
        </RadioCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tiers: { gap: 8 },
  tierHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tierName: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', rowGap: 4 },
  tierQuality: { marginTop: 3 },
});
