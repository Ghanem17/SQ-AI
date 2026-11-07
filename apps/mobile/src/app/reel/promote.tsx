import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
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
import { useI18n } from '@/i18n';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

type Area = 'city' | 'near' | 'all';

// Optional promotion after the reel is published, with an honest estimate of
// reach. Orders are estimated once the account has its own results.
export default function PromoteScreen() {
  const { c } = useTheme();
  const { L, pick, n } = useI18n();
  const { draft, updateDraft, automation, spentThisMonth } = useStudio();
  const [area, setArea] = useState<Area>('near');
  const spend = promotionCost(draft.promo, draft.promoDays);
  const reach = estimatedReach(spend);
  const left = Math.max(0, automation.monthlyCap - spentThisMonth);
  const overCap = spend > left;

  return (
    <ScrollScreen
      header={<TopBar title={L('الترويج', 'Promotion')} subtitle={L('بعد نشر الريل', 'After the reel is posted')} />}
      footer={<Button label={L('التالي: مراجعة الطلب', 'Next: review the order')} onPress={() => router.push('/reel/summary')} />}>
      <AppText size={13.5} color={c.muted} lineHeight={21}>
        {L(
          'يُنشر الريل مجانًا على صفحاتك. أما الترويج فيوصله إلى أشخاص جدد في منطقتك، وتدفع ميزانيته مباشرة إلى منصة الإعلان.',
          'The reel posts free to your pages. Promotion takes it to new people near you; its budget is paid straight to the ad platform.',
        )}
      </AppText>

      {promoOrder.map((level) => (
        <RadioCard key={level} selected={draft.promo === level} onPress={() => updateDraft({ promo: level })} label={pick(promoLevels[level].name)}>
          <View style={ui.between}>
            <AppText weight="semibold" size={15}>
              {pick(promoLevels[level].name)}
            </AppText>
            {level !== 'none' && (
              <AppText weight="medium" size={13.5} style={ui.tabular}>
                {L(`${formatIQD(promoLevels[level].daily)} / يوم`, `${formatIQD(promoLevels[level].daily)} / day`)}
              </AppText>
            )}
          </View>
          <AppText size={12.5} color={c.muted}>
            {level === 'none'
              ? L('نشر عادي على صفحاتك فقط', 'Regular posting on your pages only')
              : L(
                  `وصول متوقع من ${formatNumber(estimatedReach(promoLevels[level].daily).low)} إلى ${formatNumber(estimatedReach(promoLevels[level].daily).high)} شخص يوميًا`,
                  `Expected reach ${formatNumber(estimatedReach(promoLevels[level].daily).low)}–${formatNumber(estimatedReach(promoLevels[level].daily).high)} people a day`,
                )}
          </AppText>
        </RadioCard>
      ))}

      {draft.promo !== 'none' && (
        <>
          <SectionTitle title={L('المدة والجمهور', 'Duration and audience')} />
          <Card>
            <View style={ui.between}>
              <AppText weight="medium" size={14}>
                {L('عدد الأيام', 'Days')}
              </AppText>
              <Stepper value={draft.promoDays} onChange={(promoDays) => updateDraft({ promoDays })} min={1} max={14} format={(v) => n(v, 'day')} />
            </View>
            <Divider />
            <AppText size={12.5} color={c.muted}>
              {L('المنطقة', 'Area')}
            </AppText>
            <Segmented
              options={[
                { value: 'near', label: L('ضمن 10 كم', 'Within 10 km') },
                { value: 'city', label: L('بغداد', 'Baghdad') },
                { value: 'all', label: L('كل العراق', 'All of Iraq') },
              ]}
              value={area}
              onChange={setArea}
            />
          </Card>

          <SectionTitle title={L('التقدير', 'Estimate')} />
          <Card>
            <View style={styles.stats}>
              <Stat label={L('الوصول', 'Reach')} value={`\u2066${formatNumber(reach.low)}–${formatNumber(reach.high)}\u2069`} />
              <Stat label={L('أيام الترويج', 'Promotion days')} value={String(draft.promoDays)} />
            </View>
            <Divider />
            <KeyValue
              label={L('ميزانية الترويج', 'Promotion budget')}
              sub={`${formatIQD(promoLevels[draft.promo].daily)} × ${n(draft.promoDays, 'day')}`} value={formatIQD(spend)} strong />
          </Card>

          <Note tone={overCap ? 'bad' : 'neutral'} icon={overCap ? 'alert' : 'wallet'}>
            {overCap
              ? L(
                  `الميزانية أعلى من المتبقي في سقفك الشهري (${formatIQD(left)}). قلّل الأيام أو المستوى، أو ارفع السقف من الوضع التلقائي.`,
                  `The budget is above what is left of your monthly cap (${formatIQD(left)}). Lower the days or level, or raise the cap in Autopilot.`,
                )
              : L(
                  `المتبقي من سقف الإنفاق هذا الشهر: ${formatIQD(left)}. يتوقف الترويج تلقائيًا عند بلوغ السقف.`,
                  `Left of this month's spending cap: ${formatIQD(left)}. Promotion stops automatically at the cap.`,
                )}
          </Note>
        </>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 16 },
});
