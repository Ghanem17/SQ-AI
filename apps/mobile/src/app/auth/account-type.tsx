import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';

import { paletteNames, radius, type AccountType, type PaletteName } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { tapHaptic } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { RadioCard, Segmented, ui } from '@/components/ui';
import { ar } from '@/i18n/ar';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/theme';

const t = ar.accountType;
const options: { type: AccountType; icon: IconName; points: string[] }[] = [
  { type: 'shop', icon: 'store', points: ['ريلز لمنتجاتك وعروضك', 'رد تلقائي على الزبائن وتسجيل الطلبات', 'كلفة كل طلب من الإعلانات'] },
  { type: 'creator', icon: 'video', points: ['أفكار يومية حسب جمهورك', 'نشر على كل منصاتك', 'عروض تعاون من المحلات'] },
];

export default function AccountTypeScreen() {
  const { c } = useTheme();
  const reduceMotion = useReducedMotion();
  const { chooseAccountType, palette, setPalette } = useSession();
  const [selected, setSelected] = useState<AccountType>('shop');

  const select = (type: AccountType) => {
    if (type !== selected) tapHaptic();
    setSelected(type);
  };

  return (
    <Screen edges={['top', 'bottom']} style={styles.body}>
      <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(260)} style={styles.head}>
        <AppText weight="semibold" size={24} lineHeight={34}>
          {t.title}
        </AppText>
        <AppText size={14} color={c.muted}>
          {t.subtitle}
        </AppText>
      </Animated.View>

      <View accessibilityRole="radiogroup" style={styles.cards}>
        {options.map((o) => {
          const active = selected === o.type;
          return (
            <RadioCard key={o.type} selected={active} onPress={() => select(o.type)} label={`${t[o.type].title}، ${t[o.type].body}`}>
              <View style={styles.cardHead}>
                <View style={[styles.icon, { backgroundColor: active ? c.primary : c.tile }]}>
                  <Icon name={o.icon} color={active ? c.onPrimary : c.muted} size={20} />
                </View>
                <View style={ui.flex}>
                  <AppText weight="semibold" size={16}>
                    {t[o.type].title}
                  </AppText>
                  <AppText size={13} color={c.muted}>
                    {t[o.type].body}
                  </AppText>
                </View>
              </View>
              <View style={styles.points}>
                {o.points.map((p) => (
                  <View key={p} style={styles.point}>
                    <Icon name="check" color={active ? c.ok : c.placeholder} size={14} strokeWidth={2.2} />
                    <AppText size={13} color={active ? c.text : c.muted}>
                      {p}
                    </AppText>
                  </View>
                ))}
              </View>
            </RadioCard>
          );
        })}
      </View>

      <View style={styles.colors}>
        <AppText weight="medium" size={13} color={c.muted}>
          ألوان التطبيق
        </AppText>
        <Segmented<PaletteName>
          options={(['ocean', 'rose'] as PaletteName[]).map((p) => ({ value: p, label: paletteNames[p] }))}
          value={palette}
          onChange={setPalette}
        />
      </View>

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

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 28, gap: 20 },
  head: { gap: 4 },
  cards: { gap: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  points: { gap: 6, marginTop: 12 },
  point: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colors: { gap: 8 },
  footer: { marginTop: 'auto', paddingBottom: 8 },
});
