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
import { useI18n } from '@/i18n';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/theme';

const options: { type: AccountType; icon: IconName; points: { ar: string; en: string }[] }[] = [
  {
    type: 'shop',
    icon: 'store',
    points: [
      { ar: 'ريلز لمنتجاتك وعروضك', en: 'Reels for your products and offers' },
      { ar: 'رد تلقائي على العملاء وتسجيل الطلبات', en: 'Auto-replies to customers and order logging' },
      { ar: 'تكلفة كل طلب من الإعلانات', en: 'The ad cost of every order' },
    ],
  },
  {
    type: 'creator',
    icon: 'video',
    points: [
      { ar: 'أفكار يومية تناسب جمهورك', en: 'Daily ideas for your audience' },
      { ar: 'نشر على جميع منصاتك', en: 'Posting to all your platforms' },
      { ar: 'عروض تعاون من المتاجر', en: 'Collaboration offers from shops' },
    ],
  },
];

export default function AccountTypeScreen() {
  const { c } = useTheme();
  const reduceMotion = useReducedMotion();
  const { chooseAccountType, palette, setPalette } = useSession();
  const { t: all, L, pick } = useI18n();
  const t = all.accountType;
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
            <RadioCard key={o.type} selected={active} onPress={() => select(o.type)} label={`${t[o.type].title}${L('، ', ', ')}${t[o.type].body}`}>
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
                  <View key={p.en} style={styles.point}>
                    <Icon name="check" color={active ? c.ok : c.placeholder} size={14} strokeWidth={2.2} />
                    <AppText size={13} color={active ? c.text : c.muted}>
                      {pick(p)}
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
          {L('ألوان التطبيق', 'App colors')}
        </AppText>
        <Segmented<PaletteName>
          options={(['ocean', 'rose'] as PaletteName[]).map((p) => ({ value: p, label: pick(paletteNames[p]) }))}
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
