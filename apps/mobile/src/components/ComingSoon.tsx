import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { TAB_BAR_HEIGHT } from '@/components/TabBar';
import { ar } from '@/i18n/ar';
import { useTheme } from '@/theme/theme';

type Props = { section: 'inbox' | 'camera' | 'ads' | 'report' | 'assistant'; icon: IconName; inTabs?: boolean };

// Honest placeholder for tabs that later phases build.
export function ComingSoon({ section, icon, inTabs = true }: Props) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const copy = ar.comingSoon[section];
  return (
    <Screen style={[styles.body, { paddingBottom: (inTabs ? TAB_BAR_HEIGHT : 0) + insets.bottom + 32 }]}>
      <AppText weight="semibold" size={26}>
        {copy.title}
      </AppText>
      <Animated.View entering={FadeInDown.springify().damping(16)} style={[styles.hero, { backgroundColor: c.hero }]}>
        <View style={[styles.iconWrap, { backgroundColor: c.navActive }]}>
          <Icon name={icon} color={c.onNavActive} size={28} strokeWidth={2} />
        </View>
        <AppText weight="semibold" size={21} color={c.heroText}>
          {ar.comingSoon.note}
        </AppText>
        <AppText size={14.5} color={c.heroMuted} lineHeight={24}>
          {copy.body}
        </AppText>
        <View style={[styles.phase, { backgroundColor: c.navActive }]}>
          <AppText weight="bold" size={12} color={c.onNavActive}>
            {copy.phase}
          </AppText>
        </View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 22, gap: 14 },
  hero: { borderRadius: radius.tile, padding: 22, gap: 10 },
  iconWrap: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  phase: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.chip, marginTop: 4 },
});
