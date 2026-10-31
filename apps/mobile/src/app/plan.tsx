import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatIQD, planDiscount, planPrice, planSizes, platformNames, radius, reelPrice, tierOrder, tiers, type Platform } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PressableScale } from '@/components/PressableScale';
import { Card, Chip, Divider, KeyValue, Note, ScrollScreen, SectionTitle, Segmented, Stepper, TopBar, ui } from '@/components/ui';
import { useStudio, type Goal, type Plan } from '@/state/studio';
import { useTheme } from '@/theme/theme';

const goals: { value: Goal; label: string }[] = [
  { value: 'orders', label: 'طلبات أكثر' },
  { value: 'followers', label: 'متابعون' },
  { value: 'awareness', label: 'انتشار' },
];

const platforms: Platform[] = ['instagram', 'facebook', 'tiktok', 'youtube'];
const weekdays = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

// Reel days spread across the month, leaning on the busiest days.
function plannedDays(count: number, daysInMonth: number): Set<number> {
  const days = new Set<number>();
  const step = daysInMonth / count;
  for (let i = 0; i < count; i++) days.add(Math.min(daysInMonth, Math.round(step * i + step / 2)));
  return days;
}

export default function PlanScreen() {
  const { c } = useTheme();
  const { plan, savePlan } = useStudio();
  const [p, setP] = useState<Plan>(plan);
  const price = planPrice(p.reels, p.tier);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const monthName = new Date(year, month, 1).toLocaleDateString('ar-IQ', { month: 'long' });
  const planned = plannedDays(p.reels, daysInMonth);

  const set = (patch: Partial<Plan>) => setP((prev) => ({ ...prev, ...patch }));
  const togglePlatform = (x: Platform) => {
    const has = p.platforms.includes(x);
    if (has && p.platforms.length === 1) return;
    set({ platforms: has ? p.platforms.filter((y) => y !== x) : [...p.platforms, x] });
  };

  return (
    <ScrollScreen
      header={<TopBar title="الخطة الشهرية" subtitle={p.active ? 'مفعّلة' : 'ريلز مجدولة بسعر أقل'} />}
      footer={
        <>
          <View style={ui.between}>
            <AppText size={13} color={c.muted}>
              شهريًا مع الإعلانات
            </AppText>
            <AppText weight="semibold" size={18} style={ui.tabular}>
              {formatIQD(price.total + p.adBudget)}
            </AppText>
          </View>
          <Button
            label={plan.active ? 'احفظ التعديلات' : 'فعّل الخطة'}
            onPress={() => {
              savePlan({ ...p, active: true });
              router.back();
            }}
          />
          {plan.active && (
            <Button
              label="أوقف الخطة"
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
      <SectionTitle title="هدف الشهر" />
      <Segmented options={goals} value={p.goal} onChange={(goal) => set({ goal })} />

      <SectionTitle title="عدد الريلز" />
      <View style={styles.sizes}>
        {planSizes.map((n) => {
          const active = p.reels === n;
          const off = planDiscount(n);
          return (
            <PressableScale
              key={n}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`${n} ريلز`}
              onPress={() => set({ reels: n })}
              style={[styles.size, { borderColor: active ? c.primary : c.line, borderWidth: active ? 1.5 : 1, backgroundColor: c.card }]}>
              <AppText weight="semibold" size={20} style={ui.tabular}>
                {n}
              </AppText>
              <AppText size={11.5} color={c.muted}>
                ريل
              </AppText>
              <AppText size={11} weight="medium" color={off ? c.ok : c.placeholder}>
                {off ? `وفّر ${off * 100}%` : 'بدون خصم'}
              </AppText>
            </PressableScale>
          );
        })}
      </View>

      <SectionTitle title="الجودة الافتراضية" />
      <Segmented options={tierOrder.map((t) => ({ value: t, label: `${tiers[t].name}` }))} value={p.tier} onChange={(tier) => set({ tier })} />
      <AppText size={12} color={c.muted}>
        {tiers[p.tier].summary} · {formatIQD(reelPrice(p.tier))} للريل خارج الخطة
      </AppText>

      <SectionTitle title="المنصات" />
      <View style={ui.wrap}>
        {platforms.map((x) => (
          <Chip key={x} label={platformNames[x]} selected={p.platforms.includes(x)} onPress={() => togglePlatform(x)} />
        ))}
      </View>

      <SectionTitle title="ميزانية الإعلانات الشهرية" />
      <Card>
        <View style={ui.between}>
          <View style={ui.flex}>
            <AppText weight="medium" size={14}>
              تُوزّع على الريلز الأنجح
            </AppText>
            <AppText size={12} color={c.muted}>
              تُدفع لمنصات الإعلان مباشرة
            </AppText>
          </View>
          <Stepper value={p.adBudget} onChange={(adBudget) => set({ adBudget })} min={0} max={3000000} step={50000} format={(v) => `${v / 1000} ألف`} />
        </View>
      </Card>

      <SectionTitle title={`جدول ${monthName}`} />
      <Card>
        <View style={styles.week}>
          {weekdays.map((d) => (
            <AppText key={d} size={11.5} color={c.placeholder} center style={styles.cell}>
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
          الأيام المظللة فيها ريل. المساعد يقترح الفكرة قبلها بيوم ويذكّرك بالتصوير.
        </AppText>
      </Card>

      <SectionTitle title="السعر" />
      <Card>
        <KeyValue label={`${p.reels} ريلز ${tiers[p.tier].name}`} value={formatIQD(price.full)} />
        {price.discount > 0 && <KeyValue label={`خصم الخطة ${planDiscount(p.reels) * 100}%`} value={`− ${formatIQD(price.discount)}`} />}
        <KeyValue label="سعر الريل في الخطة" value={formatIQD(price.perReel)} />
        <Divider />
        <KeyValue label="الريلز" value={formatIQD(price.total)} strong />
        <KeyValue label="الإعلانات" value={formatIQD(p.adBudget)} />
      </Card>

      <Note icon="calendar">يمكنك تغيير الخطة أو إيقافها في أي وقت. الريلز غير المستخدمة تنتقل للشهر التالي مرة واحدة.</Note>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  sizes: { flexDirection: 'row', gap: 8 },
  size: { flex: 1, borderRadius: radius.tile, paddingVertical: 12, alignItems: 'center', gap: 1 },
  week: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  dayBox: { width: 30, height: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
});
