import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatIQD, promoLevels, promotionCost, reelPrice, tierOrder, tiers, tools, toolsCost, viaLabels, type Tier } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Badge, Card, Divider, KeyValue, Note, ScrollScreen, Segmented, TopBar, ui } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

// "Why this price?" — an itemised receipt: every step of the work, the AI or
// platform that does it, and what it costs. Promotion is listed apart
// because it is paid to the ad platform.
export default function ReceiptScreen() {
  const { c } = useTheme();
  const { L, pick, n } = useI18n();
  const params = useLocalSearchParams<{ tier?: string }>();
  const { draft } = useStudio();
  const initial = (tierOrder as string[]).includes(params.tier ?? '') ? (params.tier as Tier) : draft.tier;
  const [tier, setTier] = useState<Tier>(initial);
  const spec = tiers[tier];
  const promo = promotionCost(draft.promo, draft.promoDays);

  return (
    <ScrollScreen header={<TopBar title={L('لماذا هذا السعر؟', 'Why this price?')} subtitle={L('تفاصيل تكلفة الريل', 'What the reel costs')} mode="close" />}>
      <Segmented options={tierOrder.map((t) => ({ value: t, label: pick(tiers[t].name) }))} value={tier} onChange={setTier} />

      <Card>
        <View style={ui.between}>
          <View>
            <AppText size={12.5} color={c.muted}>
              {L(`ريل ${spec.name.ar}`, `${spec.name.en} reel`)}
            </AppText>
            <AppText variant="h1">
              {formatIQD(reelPrice(tier))}
            </AppText>
          </View>
          <Badge tone="pri" icon="clock" label={`${spec.resolution} · ${n(spec.deliveryHours, 'hour')}`} />
        </View>
        <Divider />
        {spec.items.map((item, i) => (
          <View key={item.task.en} style={styles.item}>
            <View style={[styles.step, { backgroundColor: c.tile }]}>
              <AppText weight="bold" size={12} color={c.muted}>
                {i + 1}
              </AppText>
            </View>
            <View style={ui.flex}>
              <AppText size={13.5} lineHeight={20} weight="semibold">
                {pick(item.task)}
              </AppText>
              <AppText size={12} color={c.muted}>
                {item.tools.map((t) => `${tools[t].name} · ${pick(viaLabels[tools[t].via])}`).join(L('، ', ', '))}
              </AppText>
            </View>
            <AppText size={12.5} lineHeight={20} weight="semibold">
              {formatIQD(item.cost)}
            </AppText>
          </View>
        ))}
        <Divider dashed />
        <View>
          <KeyValue label={L('تكلفة أدوات الذكاء الاصطناعي', 'AI tools cost')} value={formatIQD(toolsCost(tier))} />
          <KeyValue divider label={L('رسوم الخدمة', 'Service fee')} sub={L('المراجعة والتخزين والنشر والدعم', 'Review, storage, posting and support')} value={formatIQD(spec.serviceFee)} />
          <KeyValue divider icon="receipt" label={L('المجموع', 'Total')} value={formatIQD(reelPrice(tier))} strong />
        </View>
      </Card>

      {draft.promo !== 'none' && (
        <Card>
          <AppText variant="h3">
            {L('الترويج (يُدفع إلى منصة الإعلان)', 'Promotion (paid to the ad platform)')}
          </AppText>
          <KeyValue
            label={`${pick(promoLevels[draft.promo].name)} · ${n(draft.promoDays, 'day')}`}
            sub={L(`${formatIQD(promoLevels[draft.promo].daily)} يوميًا`, `${formatIQD(promoLevels[draft.promo].daily)} a day`)}
            value={formatIQD(promo)}
          />
          <KeyValue divider label={L('الإجمالي مع الترويج', 'Total with promotion')} value={formatIQD(reelPrice(tier) + promo)} strong />
        </Card>
      )}

      <Note tone="info" icon="layers">
        {L(
          'تعمل جميع نماذج الذكاء الاصطناعي عبر حساب fal.ai واحد، والمونتاج على خادمنا بأداة ffmpeg المجانية، لذلك تكلفة الأدوات منخفضة ورسوم الخدمة هي معظم السعر.',
          'All AI models run through one fal.ai account and editing runs on our server with the free ffmpeg, so tool costs are low and the service fee is most of the price.',
        )}
      </Note>
      <Note>
        {L(
          'الأسعار تجريبية وتُحسب من تكلفة كل أداة لكل ريل. عند تغيّر أسعار المزودين يتغير السعر هنا تلقائيًا، وترى ذلك قبل أي طلب.',
          'Prices are trial values, worked out from each tool’s cost per reel. When providers change prices, this updates automatically and you see it before any order.',
        )}
      </Note>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
  step: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
