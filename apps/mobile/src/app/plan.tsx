import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatIQD, planDiscount, planPrice, planSizes, platformNames, radius, reelPrice, tierOrder, tiers, type Platform } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PressableScale } from '@/components/PressableScale';
import { Card, Chip, KeyValue, Note, ScrollScreen, SectionTitle, Segmented, Stepper, TopBar, ui } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useStudio, type Goal, type Plan } from '@/state/studio';
import { useTheme } from '@/theme/theme';

const goals: { value: Goal; label: { ar: string; en: string } }[] = [
  { value: 'orders', label: { ar: 'طلبات أكثر', en: 'More orders' } },
  { value: 'followers', label: { ar: 'متابعون', en: 'Followers' } },
  { value: 'awareness', label: { ar: 'انتشار', en: 'Reach' } },
];

const platforms: Platform[] = ['instagram', 'facebook', 'tiktok', 'youtube'];
const weekdays = { ar: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'], en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'] };

// Reel days spread across the month, leaning on the busiest days.
function plannedDays(count: number, daysInMonth: number): Set<number> {
  const days = new Set<number>();
  const step = daysInMonth / count;
  for (let i = 0; i < count; i++) days.add(Math.min(daysInMonth, Math.round(step * i + step / 2)));
  return days;
}

export default function PlanScreen() {
  const { c } = useTheme();
  const { L, pick, lang } = useI18n();
  const { plan, savePlan } = useStudio();
  const [p, setP] = useState<Plan>(plan);
  const price = planPrice(p.reels, p.tier);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const monthName = new Date(year, month, 1).toLocaleDateString(lang === 'ar' ? 'ar-IQ' : 'en-GB', { month: 'long' });
  const planned = plannedDays(p.reels, daysInMonth);

  const set = (patch: Partial<Plan>) => setP((prev) => ({ ...prev, ...patch }));
  const togglePlatform = (x: Platform) => {
    const has = p.platforms.includes(x);
    if (has && p.platforms.length === 1) return;
    set({ platforms: has ? p.platforms.filter((y) => y !== x) : [...p.platforms, x] });
  };

  return (
    <ScrollScreen
      header={<TopBar title={L('الخطة الشهرية', 'Monthly plan')} subtitle={p.active ? L('مفعّلة', 'Active') : L('ريلز مجدولة بسعر أقل', 'Scheduled reels at a lower price')} />}
      footer={
        <>
          <View style={ui.between}>
            <AppText size={13} color={c.muted}>
              {L('شهريًا مع الإعلانات', 'Monthly, with ads')}
            </AppText>
            <AppText weight="bold" size={20} lineHeight={28}>
              {formatIQD(price.total + p.adBudget)}
            </AppText>
          </View>
          <Button
            label={plan.active ? L('احفظ التعديلات', 'Save changes') : L('فعّل الخطة', 'Turn on plan')}
            onPress={() => {
              savePlan({ ...p, active: true });
              router.back();
            }}
          />
          {plan.active && (
            <Button
              label={L('أوقف الخطة', 'Stop plan')}
              variant="ghost"
              height={40}
              onPress={() => {
                savePlan({ ...p, active: false });
                router.back();
              }}
            />
          )}
        </>
      }>
      <SectionTitle title={L('هدف الشهر', 'Goal this month')} />
      <Segmented options={goals.map((g) => ({ value: g.value, label: pick(g.label) }))} value={p.goal} onChange={(goal) => set({ goal })} />

      <SectionTitle title={L('عدد الريلز', 'Number of reels')} />
      <View style={styles.sizes}>
        {planSizes.map((n) => {
          const active = p.reels === n;
          const off = planDiscount(n);
          return (
            <PressableScale
              key={n}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={L(`${n} ريلز`, `${n} reels`)}
              onPress={() => set({ reels: n })}
              style={[styles.size, { borderColor: active ? c.primary : c.line, borderWidth: active ? 1.5 : 1, backgroundColor: c.card }]}>
              <AppText weight="bold" size={20} lineHeight={26}>
                {n}
              </AppText>
              <AppText size={11.5} color={c.muted}>
                {L('ريل', 'reels')}
              </AppText>
              <AppText size={11} weight="medium" color={off ? c.ok : c.placeholder}>
                {off ? L(`وفّر ${off * 100}%`, `Save ${off * 100}%`) : L('دون خصم', 'No discount')}
              </AppText>
            </PressableScale>
          );
        })}
      </View>

      <SectionTitle title={L('الجودة الافتراضية', 'Default quality')} />
      <Segmented options={tierOrder.map((t) => ({ value: t, label: pick(tiers[t].name) }))} value={p.tier} onChange={(tier) => set({ tier })} />
      <AppText size={12} color={c.muted}>
        {pick(tiers[p.tier].summary)} · {L(`${formatIQD(reelPrice(p.tier))} للريل خارج الخطة`, `${formatIQD(reelPrice(p.tier))} per reel outside the plan`)}
      </AppText>

      <SectionTitle title={L('المنصات', 'Platforms')} />
      <View style={ui.wrap}>
        {platforms.map((x) => (
          <Chip key={x} label={pick(platformNames[x])} selected={p.platforms.includes(x)} onPress={() => togglePlatform(x)} />
        ))}
      </View>

      <SectionTitle title={L('ميزانية الإعلانات الشهرية', 'Monthly ad budget')} />
      <Card>
        <View style={ui.between}>
          <View style={ui.flex}>
            <AppText variant="rowTitle">
              {L('تُوزَّع على الريلز الأنجح', 'Spread over the best-performing reels')}
            </AppText>
            <AppText size={12} color={c.muted}>
              {L('تُدفع إلى منصات الإعلان مباشرة', 'Paid to the ad platforms directly')}
            </AppText>
          </View>
          <Stepper value={p.adBudget} onChange={(adBudget) => set({ adBudget })} min={0} max={3000000} step={50000} format={(v) => L(`${v / 1000} ألف`, `${v / 1000}k`)} />
        </View>
      </Card>

      <SectionTitle title={L(`جدول ${monthName}`, `${monthName} schedule`)} />
      <Card>
        <View style={styles.week}>
          {weekdays[lang].map((d, i) => (
            <AppText key={`${d}${i}`} size={11.5} color={c.placeholder} center style={styles.cell}>
              {d}
            </AppText>
          ))}
        </View>
        <View style={styles.grid}>
          {Array.from({ length: firstWeekday }, (_, i) => (
            <View key={`e${i}`} style={styles.cell} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const on = planned.has(day);
            return (
              <View key={day} style={styles.cell}>
                <View style={[styles.dayBox, on && { backgroundColor: c.primary }]}>
                  <AppText size={12} weight={on ? 'semibold' : 'regular'} color={on ? c.onPrimary : c.muted} style={ui.tabular}>
                    {day}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
        <AppText size={12} color={c.muted}>
          {L('في كل يوم مظلل ريل. يقترح المساعد الفكرة قبله بيوم ويذكّرك بالتصوير.', 'Each shaded day has a reel. The assistant suggests the idea a day before and reminds you to film.')}
        </AppText>
      </Card>

      <SectionTitle title={L('السعر', 'Price')} />
      <Card style={styles.kv}>
        <KeyValue label={L(`${p.reels} ريلز ${tiers[p.tier].name.ar}`, `${p.reels} ${tiers[p.tier].name.en} reels`)} value={formatIQD(price.full)} />
        {price.discount > 0 && <KeyValue divider label={L(`خصم الخطة ${planDiscount(p.reels) * 100}%`, `Plan discount ${planDiscount(p.reels) * 100}%`)} value={`− ${formatIQD(price.discount)}`} />}
        <KeyValue divider label={L('سعر الريل في الخطة', 'Price per reel in the plan')} value={formatIQD(price.perReel)} />
        <KeyValue divider label={L('الإعلانات', 'Ads')} value={formatIQD(p.adBudget)} />
        <KeyValue divider label={L('الريلز', 'Reels')} value={formatIQD(price.total)} strong />
      </Card>

      <Note icon="calendar">
        {L(
          'يمكنك تغيير الخطة أو إيقافها في أي وقت. تنتقل الريلز غير المستخدمة إلى الشهر التالي مرة واحدة.',
          'Change or stop the plan any time. Unused reels carry over to the next month once.',
        )}
      </Note>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  sizes: { flexDirection: 'row', gap: 8 },
  kv: { paddingVertical: 6, gap: 0 },
  size: { flex: 1, borderRadius: radius.tier, paddingVertical: 12, alignItems: 'center', gap: 1 },
  week: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  dayBox: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
