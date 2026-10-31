import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  estimatedOrders,
  estimatedReach,
  formatIQD,
  formatNumber,
  promoLevels,
  promoOrder,
  promotionCost,
} from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card, Divider, KeyValue, Note, RadioCard, ScrollScreen, SectionTitle, Segmented, Stat, Stepper, TopBar, ui } from '@/components/ui';
import { sampleToday } from '@/mock/today';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

type Area = 'city' | 'near' | 'all';

// Optional promotion after the reel is published, with an honest estimate of
// reach and orders based on the account's own cost per order.
export default function PromoteScreen() {
  const { c } = useTheme();
  const { draft, updateDraft, automation, spentThisMonth } = useStudio();
  const [area, setArea] = useState<Area>('near');
  const spend = promotionCost(draft.promo, draft.promoDays);
  const reach = estimatedReach(spend);
  const orders = estimatedOrders(spend, sampleToday.costPerOrder);
  const left = Math.max(0, automation.monthlyCap - spentThisMonth);
  const overCap = spend > left;

  return (
    <ScrollScreen
      header={<TopBar title="الترويج" subtitle="بعد نشر الريل" />}
      footer={<Button label="التالي: مراجعة الطلب" onPress={() => router.push('/reel/summary')} />}>
      <AppText size={13.5} color={c.muted} lineHeight={21}>
        الريل يُنشر مجانًا على صفحاتك. الترويج يوصله لناس جدد في منطقتك، وتدفع ميزانيته مباشرة لمنصة الإعلان.
      </AppText>

      {promoOrder.map((level) => (
        <RadioCard key={level} selected={draft.promo === level} onPress={() => updateDraft({ promo: level })} label={promoLevels[level].name}>
          <View style={ui.between}>
            <AppText weight="semibold" size={15}>
              {promoLevels[level].name}
            </AppText>
            {level !== 'none' && (
              <AppText weight="medium" size={13.5} style={ui.tabular}>
                {formatIQD(promoLevels[level].daily)} / يوم
              </AppText>
            )}
          </View>
          <AppText size={12.5} color={c.muted}>
            {level === 'none'
              ? 'نشر عادي على صفحاتك فقط'
              : `وصول متوقع ${formatNumber(estimatedReach(promoLevels[level].daily).low)} إلى ${formatNumber(estimatedReach(promoLevels[level].daily).high)} شخص يوميًا`}
          </AppText>
        </RadioCard>
      ))}

      {draft.promo !== 'none' && (
        <>
          <SectionTitle title="المدة والجمهور" />
          <Card>
            <View style={ui.between}>
              <AppText weight="medium" size={14}>
                عدد الأيام
              </AppText>
              <Stepper value={draft.promoDays} onChange={(promoDays) => updateDraft({ promoDays })} min={1} max={14} format={(v) => `${v} أيام`} />
            </View>
            <Divider />
            <AppText size={12.5} color={c.muted}>
              المنطقة
            </AppText>
            <Segmented
              options={[
                { value: 'near', label: 'ضمن 10 كم' },
                { value: 'city', label: 'بغداد' },
                { value: 'all', label: 'كل العراق' },
              ]}
              value={area}
              onChange={setArea}
            />
          </Card>

          <SectionTitle title="التقدير" />
          <Card>
            <View style={styles.stats}>
              <Stat label="الوصول" value={`\u2066${formatNumber(reach.low)}–${formatNumber(reach.high)}\u2069`} />
              <Stat label="طلبات متوقعة" value={`\u2066${orders.low}–${orders.high}\u2069`} />
            </View>
            <Divider />
            <KeyValue label="ميزانية الترويج" sub={`${formatIQD(promoLevels[draft.promo].daily)} × ${draft.promoDays} أيام`} value={formatIQD(spend)} strong />
          </Card>

          <Note tone={overCap ? 'bad' : 'neutral'} icon={overCap ? 'alert' : 'wallet'}>
            {overCap
              ? `الميزانية أعلى من المتبقي في سقفك الشهري (${formatIQD(left)}). خفّض الأيام أو المستوى، أو ارفع السقف من الوضع التلقائي.`
              : `المتبقي من سقف الصرف هذا الشهر: ${formatIQD(left)}. يتوقف الترويج تلقائيًا عند الوصول للسقف.`}
          </Note>
        </>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 16 },
});
