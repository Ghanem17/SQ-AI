import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ActionSheet } from '@/components/ActionSheet';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { TAB_BAR_HEIGHT } from '@/components/layout';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';

export { TAB_BAR_HEIGHT };

type TabKey = 'index' | 'services' | 'report' | 'account';

const icons: Record<TabKey, [IconName, IconName]> = {
  index: ['home', 'homeFill'],
  services: ['apps', 'appsFill'],
  report: ['chart', 'chartFill'],
  account: ['user', 'userFill'],
};

// A flat bar with a hairline on top. The active tab gets the filled icon and
// a short accent bar; the centre action opens a small sheet of shortcuts.
export function TabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const { c, elev } = useTheme();
  const { t, rtl } = useI18n();
  const [sheet, setSheet] = useState(false);
  const routes = state.routes.map((route, i) => ({ route, i }));
  const half = Math.ceil(routes.length / 2);

  const tab = ({ route, i }: (typeof routes)[number]) => {
    const key = route.name as TabKey;
    const active = i === state.index;
    const label = t.tabs[key];
    const color = active ? c.navActive : c.navText;
    return (
      <PressableScale
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
        onPress={() => {
          if (!active) navigateToTab(route.key);
        }}
        pressedScale={0.96}
        style={styles.item}>
        {active && <View style={[styles.indicator, { backgroundColor: c.navIndicator }]} />}
        <Icon name={icons[key][active ? 1 : 0]} color={color} size={22} />
        <AppText size={11} lineHeight={14} weight={active ? 'semibold' : 'medium'} color={color} numberOfLines={1}>
          {label}
        </AppText>
      </PressableScale>
    );
  };

  return (
    <View style={[styles.wrap, { direction: rtl ? 'rtl' : 'ltr', backgroundColor: c.nav, borderTopColor: c.line, paddingBottom: Math.max(insets.bottom, 6) }]}>
      <View accessibilityRole="tablist" style={styles.bar}>
        {routes.slice(0, half).map(tab)}
        <View style={styles.fabSlot}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t.tabs.action}
            onPress={() => setSheet(true)}
            pressedScale={0.94}
            style={[styles.fab, { backgroundColor: c.fab, borderColor: c.bg }, elev.fab]}>
            <View style={styles.fabRing} />
            <Icon name="plus" color={c.onFab} size={24} strokeWidth={2} />
          </PressableScale>
        </View>
        {routes.slice(half).map(tab)}
      </View>
      <ActionSheet visible={sheet} onClose={() => setSheet(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1 },
  bar: { flexDirection: 'row', height: TAB_BAR_HEIGHT, alignItems: 'flex-start', justifyContent: 'space-around', paddingTop: 10, paddingHorizontal: 8 },
  item: { width: 64, alignItems: 'center', gap: 4 },
  indicator: { position: 'absolute', top: -11, width: 22, height: 2, borderRadius: 1 },
  fabSlot: { width: 64, alignItems: 'center' },
  fab: { width: 64, height: 64, borderRadius: 32, borderWidth: 5, marginTop: -37, alignItems: 'center', justifyContent: 'center' },
  fabRing: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 27, borderWidth: 1, borderColor: 'rgba(244,214,176,0.35)' },
});
