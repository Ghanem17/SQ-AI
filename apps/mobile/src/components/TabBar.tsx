import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { ar } from '@/i18n/ar';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/theme';

const PAD = 6;
const GAP = 4;
export const TAB_BAR_HEIGHT = 64;

type Frame = { x: number; width: number };

type TabKey = 'index' | 'inbox' | 'camera' | 'ads' | 'report';

const shopIcons: Record<TabKey, IconName> = { index: 'home', inbox: 'chat', camera: 'camera', ads: 'ads', report: 'chart' };
const creatorIcons: Record<TabKey, IconName> = { index: 'home', inbox: 'users', camera: 'camera', ads: 'bulb', report: 'trend' };
const labelKey: Record<TabKey, 'today' | 'inbox' | 'camera' | 'ads' | 'report'> = {
  index: 'today',
  inbox: 'inbox',
  camera: 'camera',
  ads: 'ads',
  report: 'report',
};

// Floating Bento tab bar. The sand pill slides to the active tab.
export function TabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const { c } = useTheme();
  const { accountType } = useSession();
  const creator = accountType === 'creator';
  const labels = ar.tabs[creator ? 'creator' : 'shop'];
  const icons = creator ? creatorIcons : shopIcons;
  const reduceMotion = useReducedMotion();

  // Item positions come from layout, which is in physical pixels on every
  // platform, so the pill lands under the active tab in RTL and LTR alike.
  const [frames, setFrames] = useState<Record<number, Frame>>({});
  const target = frames[state.index];
  const x = useSharedValue(0);
  const w = useSharedValue(0);
  const placed = useRef(false);

  useEffect(() => {
    if (!target) return;
    if (!placed.current || reduceMotion) {
      x.set(target.x);
      w.set(target.width);
      placed.current = true;
      return;
    }
    x.set(withSpring(target.x, { damping: 18, stiffness: 220 }));
    w.set(withSpring(target.width, { damping: 18, stiffness: 220 }));
  }, [target, reduceMotion, x, w]);

  const pill = useAnimatedStyle(() => ({ width: w.get(), transform: [{ translateX: x.get() }] }));

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + 12 }]}>
      <View accessibilityRole="tablist" style={[styles.bar, { backgroundColor: c.nav }]}>
        {target && <Animated.View style={[styles.pill, { backgroundColor: c.navActive }, pill]} />}
        {state.routes.map((route, i) => {
          const key = route.name as TabKey;
          const active = i === state.index;
          const color = active ? c.onNavActive : c.navText;
          return (
            <PressableScale
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={labels[labelKey[key]]}
              onPress={() => {
                if (!active) navigateToTab(route.key);
              }}
              onLayout={(e) => {
                const { x: fx, width: fw } = e.nativeEvent.layout;
                setFrames((prev) => (prev[i]?.x === fx && prev[i]?.width === fw ? prev : { ...prev, [i]: { x: fx, width: fw } }));
              }}
              style={styles.item}>
              <Icon name={icons[key]} color={color} size={19} strokeWidth={active ? 2 : 1.8} />
              <AppText size={11.5} lineHeight={16} weight={active ? 'semibold' : 'regular'} color={color}>
                {labels[labelKey[key]]}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, direction: 'rtl' },
  bar: { flexDirection: 'row', padding: PAD, gap: GAP, borderRadius: 26, height: TAB_BAR_HEIGHT },
  pill: { position: 'absolute', top: PAD, left: 0, bottom: PAD, borderRadius: 20 },
  item: { flex: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 2 },
});
