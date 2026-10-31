import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { FadeInDown, useAnimatedStyle, useReducedMotion, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { brand, radius, type AccountType } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale, tapHaptic } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { ar } from '@/i18n/ar';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/theme';

const t = ar.accountType;
const options: { type: AccountType; icon: IconName }[] = [
  { type: 'shop', icon: 'store' },
  { type: 'creator', icon: 'video' },
];

export default function AccountTypeScreen() {
  const { c } = useTheme();
  const reduceMotion = useReducedMotion();
  const { chooseAccountType } = useSession();
  const [selected, setSelected] = useState<AccountType>('shop');

  const select = (type: AccountType) => {
    if (type !== selected) tapHaptic();
    setSelected(type);
  };

  // The second card sits on the left in RTL: a drag to the right selects it.
  const swipe = usePanGesture({
    activeOffsetX: [-16, 16],
    onDeactivate: (e) => {
      'worklet';
      if (e.translationX > 50) scheduleOnRN(select, 'creator' as AccountType);
      else if (e.translationX < -50) scheduleOnRN(select, 'shop' as AccountType);
    },
  });

  return (
    <Screen edges={['top', 'bottom']} style={styles.body}>
      <Animated.View entering={reduceMotion ? undefined : FadeInDown.springify().damping(16)} style={styles.head}>
        <AppText weight="semibold" size={28} lineHeight={38}>
          {t.title}
        </AppText>
        <AppText size={15} color={c.muted}>
          {t.subtitle}
        </AppText>
      </Animated.View>

      <GestureDetector gesture={swipe}>
        <View accessibilityRole="radiogroup" style={styles.cards}>
          {options.map((o, i) => (
            <Card key={o.type} order={i} icon={o.icon} copy={t[o.type]} active={selected === o.type} onPress={() => select(o.type)} />
          ))}
        </View>
      </GestureDetector>

      <View style={styles.footer}>
        <Button
          label={t.continue}
          onPress={() => {
            chooseAccountType(selected);
            router.replace('/(tabs)');
          }}
        />
      </View>
    </Screen>
  );
}

function Card({
  order,
  icon,
  copy,
  active,
  onPress,
}: {
  order: number;
  icon: IconName;
  copy: { title: string; body: string };
  active: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const reduceMotion = useReducedMotion();
  const grow = useAnimatedStyle(() => ({
    transform: [{ scale: reduceMotion ? 1 : withSpring(active ? 1 : 0.94, { damping: 14, stiffness: 200 }) }],
    opacity: withSpring(active ? 1 : 0.8),
  }));

  return (
    <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(120 + order * 90).springify().damping(15)} style={styles.cardWrap}>
      <Animated.View style={grow}>
        <PressableScale
          accessibilityRole="radio"
          accessibilityState={{ checked: active }}
          accessibilityLabel={`${copy.title}، ${copy.body}`}
          onPress={onPress}
          style={[
            styles.card,
            { backgroundColor: active ? c.sandTile : c.tile, borderColor: active ? c.primary : 'transparent' },
          ]}>
          <View style={[styles.icon, { backgroundColor: active ? c.hero : c.bg }]}>
            <Icon name={icon} color={active ? c.navActive : c.muted} size={26} strokeWidth={1.9} />
          </View>
          <AppText weight="semibold" size={18} lineHeight={26} color={active ? c.onSandTile : c.text}>
            {copy.title}
          </AppText>
          <AppText size={13.5} lineHeight={21} color={active ? brand.inkOnSand : c.muted}>
            {copy.body}
          </AppText>
          <View style={[styles.radio, { borderColor: active ? c.onSandTile : c.muted }]}>
            {active && <View style={[styles.radioDot, { backgroundColor: c.onSandTile }]} />}
          </View>
        </PressableScale>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 28, gap: 24 },
  head: { gap: 6, paddingHorizontal: 4 },
  cards: { flexDirection: 'row', gap: 10 },
  cardWrap: { flex: 1 },
  card: { borderRadius: radius.tile, padding: 18, minHeight: 250, gap: 8, borderWidth: 2 },
  icon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 'auto' },
  radio: { marginTop: 10, width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  footer: { marginTop: 'auto', paddingBottom: 8 },
});
