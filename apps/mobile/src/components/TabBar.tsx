import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';

import { radius } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { ar } from '@/i18n/ar';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/theme';

export const TAB_BAR_HEIGHT = 58;

type TabKey = 'index' | 'inbox' | 'camera' | 'ads' | 'report';

const shopIcons: Record<TabKey, IconName> = { index: 'home', inbox: 'chat', camera: 'camera', ads: 'ads', report: 'chart' };
const creatorIcons: Record<TabKey, IconName> = { index: 'home', inbox: 'handshake', camera: 'camera', ads: 'bulb', report: 'trend' };
const labelKey: Record<TabKey, 'today' | 'inbox' | 'camera' | 'ads' | 'report'> = {
  index: 'today',
  inbox: 'inbox',
  camera: 'camera',
  ads: 'ads',
  report: 'report',
};

// Docked tab bar with a hairline top border. The camera tab is a filled key,
// since filming is the one action the whole app is built around.
export function TabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const { c } = useTheme();
  const { accountType } = useSession();
  const creator = accountType === 'creator';
  const labels = ar.tabs[creator ? 'creator' : 'shop'];
  const icons = creator ? creatorIcons : shopIcons;

  return (
    <View style={[styles.wrap, { backgroundColor: c.nav, borderTopColor: c.line, paddingBottom: insets.bottom }]}>
      <View accessibilityRole="tablist" style={styles.bar}>
        {state.routes.map((route, i) => {
          const key = route.name as TabKey;
          const active = i === state.index;
          const label = labels[labelKey[key]];
          const camera = key === 'camera';
          const color = camera ? c.onPrimary : active ? c.navActive : c.navText;
          return (
            <PressableScale
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              onPress={() => {
                if (!active) navigateToTab(route.key);
              }}
              style={styles.item}>
              {camera ? (
                <View style={[styles.key, { backgroundColor: c.primary }]}>
                  <Icon name="camera" color={color} size={20} strokeWidth={1.9} />
                </View>
              ) : (
                <>
                  <View style={[styles.marker, { backgroundColor: active ? c.navActive : 'transparent' }]} />
                  <Icon name={icons[key]} color={color} size={21} strokeWidth={active ? 2 : 1.7} />
                  <AppText size={11} lineHeight={15} weight={active ? 'semibold' : 'regular'} color={color}>
                    {label}
                  </AppText>
                </>
              )}
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: StyleSheet.hairlineWidth, direction: 'rtl' },
  bar: { flexDirection: 'row', height: TAB_BAR_HEIGHT, alignItems: 'stretch' },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  marker: { position: 'absolute', top: 0, width: 28, height: 2, borderRadius: 1 },
  key: { width: 46, height: 38, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
});
