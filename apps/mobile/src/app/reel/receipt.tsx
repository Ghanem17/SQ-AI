import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatIQD, promoLevels, promotionCost, reelPrice, tierOrder, tiers, tools, toolsCost, viaLabels, type Tier } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Card, Divider, KeyValue, Note, ScrollScreen, Segmented, TopBar, ui } from '@/components/ui';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

// "ليش هالسعر؟" — an itemised receipt: every step of the work, the AI or
// platform that does it, and what it costs. Promotion is listed apart
// because it is paid to the ad platform.
export default function ReceiptScreen() {
  const { c } = useTheme();
  const params = useLocalSearchParams<{ tier?: string }>();
  const { draft } = useStudio();
  const initial = (tierOrder as string[]).includes(params.tier ?? '') ? (params.tier as Tier) : draft.tier;
  const [tier, setTier] = useState<Tier>(initial);
  const spec = tiers[tier];
  const promo = promotionCost(draft.promo, draft.promoDays);

  return (
    <ScrollScreen header={<TopBar title="ليش هالسعر؟" subtitle="تفاصيل كلفة الريل" mode="close" />}>
      <Segmented options={tierOrder.map((t) => ({ value: t, label: tiers[t].name }))} value={tier} onChange={setTier} />

      <Card>
        <View style={ui.between}>
          <View>
            <AppText size={12.5} color={c.muted}>
              ريل {spec.name}
            </AppText>
            <AppText weight="semibold" size={24} lineHeight={32} style={ui.tabular}>
              {formatIQD(reelPrice(tier))}
            </AppText>
          </View>
          <View style={styles.stamp}>
            <AppText size={11.5} color={c.muted}>
              {spec.resolution} · {spec.deliveryHours} ساعات
            </AppText>
          </View>
        </View>
        <Divider />
        {spec.items.map((item, i) => (
          <View key={item.task} style={styles.item}>
            <View style={[styles.step, { backgroundColor: c.tile }]}>
              <AppText weight="semibold" size={12} color={c.muted} style={ui.tabular}>
                {i + 1}
              </AppText>
            </View>
            <View style={ui.flex}>
              <AppText size={14} weight="medium">
                {item.task}
              </AppText>
              <AppText size={12} color={c.muted}>
                {item.tools.map((t) => `${tools[t].name} · ${viaLabels[tools[t].via]}`).join('، ')}
              </AppText>
            </View>
            <AppText size={13.5} weight="medium" style={ui.tabular}>
              {formatIQD(item.cost)}
            </AppText>
          </View>
        ))}
        <Divider />
        <KeyValue label="كلفة أدوات الذكاء الاصطناعي" value={formatIQD(toolsCost(tier))} />
        <KeyValue label="رسوم الخدمة" sub="المراجعة، التخزين، النشر، والدعم" value={formatIQD(spec.serviceFee)} />
        <Divider />
        <KeyValue label="المجموع" value={formatIQD(reelPrice(tier))} strong />
      </Card>

      {draft.promo !== 'none' && (
        <Card>
          <AppText weight="semibold" size={14.5}>
            الترويج (يُدفع لمنصة الإعلان)
          </AppText>
          <KeyValue
            label={`${promoLevels[draft.promo].name} · ${draft.promoDays} أيام`}
            sub={`${formatIQD(promoLevels[draft.promo].daily)} يوميًا`}
            value={formatIQD(promo)}
          />
          <Divider />
          <KeyValue label="الإجمالي مع الترويج" value={formatIQD(reelPrice(tier) + promo)} strong />
        </Card>
      )}

      <Note icon="layers">
        كل نماذج الذكاء الاصطناعي تعمل عبر حساب fal.ai واحد، والمونتاج على سيرفرنا بأداة ffmpeg المجانية، لذلك كلفة الأدوات منخفضة ورسوم الخدمة هي معظم السعر.
      </Note>
      <Note>
        الأسعار تجريبية وتُحسب من كلفة كل أداة لكل ريل. عند تغيّر أسعار المزودين يتغير السعر هنا تلقائيًا، وترى ذلك قبل أي طلب.
      </Note>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  stamp: { alignItems: 'flex-end' },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
  step: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});
