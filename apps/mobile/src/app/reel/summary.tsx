import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';

import { formatIQD, platformNames, promoLevels, promotionCost, reelPrice, tiers } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Card, Divider, KeyValue, Note, ScrollScreen, SectionTitle, TopBar, ui } from '@/components/ui';
import { describeWhen } from '@/features/reel/when';
import { todayShots } from '@/mock/data';
import { useStudio, type Order } from '@/state/studio';
import { useTheme } from '@/theme/theme';

// Final check before the order is placed, then a confirmation with the
// timeline of what happens next.
export default function SummaryScreen() {
  const { c } = useTheme();
  const { draft, placeOrder, automation } = useStudio();
  const [order, setOrder] = useState<Order | null>(null);
  const price = reelPrice(draft.tier);
  const promo = promotionCost(draft.promo, draft.promoDays);

  if (order) return <Placed order={order} />;

  return (
    <ScrollScreen
      header={<TopBar title="مراجعة الطلب" subtitle={draft.title} />}
      footer={
        <>
          <View style={ui.between}>
            <AppText size={13} color={c.muted}>
              الإجمالي
            </AppText>
            <AppText weight="semibold" size={18} style={ui.tabular}>
              {formatIQD(price + promo)}
            </AppText>
          </View>
          <Button label="أكّد الطلب" icon="check" onPress={() => setOrder(placeOrder())} />
        </>
      }>
      <Card>
        <Row label="اللقطات" value={`${draft.captured.length || todayShots.length} من ${todayShots.length}`} onEdit={() => router.navigate('/(tabs)/camera')} />
        <Divider />
        <Row label="الجودة" value={`${tiers[draft.tier].name} · ${tiers[draft.tier].resolution}`} onEdit={() => router.navigate('/reel/quality')} />
        <Divider />
        <Row label="المنصات" value={draft.platforms.map((p) => platformNames[p]).join('، ')} onEdit={() => router.navigate('/reel/publish')} />
        <Divider />
        <Row label="وقت النشر" value={describeWhen(draft.when)} onEdit={() => router.navigate('/reel/publish')} />
        <Divider />
        <Row
          label="الترويج"
          value={draft.promo === 'none' ? 'بدون ترويج' : `${promoLevels[draft.promo].name} · ${draft.promoDays} أيام`}
          onEdit={() => router.navigate('/reel/promote')}
        />
      </Card>

      <SectionTitle title="الكلفة" action="ليش هالسعر؟" onAction={() => router.push({ pathname: '/reel/receipt', params: { tier: draft.tier } })} />
      <Card>
        <KeyValue label={`ريل ${tiers[draft.tier].name}`} value={formatIQD(price)} />
        {draft.promo !== 'none' && <KeyValue label="ميزانية الترويج" sub="تُدفع لمنصة الإعلان" value={formatIQD(promo)} />}
        <Divider />
        <KeyValue label="الإجمالي" value={formatIQD(price + promo)} strong />
      </Card>

      <Note icon="shield">
        {automation.approval === 'ask'
          ? 'نرسل لك الريل النهائي للموافقة قبل النشر، ولا يُخصم شيء قبل موافقتك.'
          : 'الموافقة التلقائية مفعّلة: يُنشر الريل مباشرة بعد المونتاج. يمكنك تغيير ذلك من الوضع التلقائي.'}
      </Note>
    </ScrollScreen>
  );
}

function Row({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  const { c } = useTheme();
  return (
    <View style={styles.row}>
      <View style={ui.flex}>
        <AppText size={12.5} color={c.muted}>
          {label}
        </AppText>
        <AppText size={14.5} weight="medium">
          {value}
        </AppText>
      </View>
      <PressableScale accessibilityRole="button" accessibilityLabel={`تعديل ${label}`} onPress={onEdit} style={styles.edit}>
        <AppText size={13} weight="medium" color={c.primary}>
          تعديل
        </AppText>
      </PressableScale>
    </View>
  );
}

function Placed({ order }: { order: Order }) {
  const { c } = useTheme();
  const { startDraft } = useStudio();
  const reduceMotion = useReducedMotion();
  const steps = [
    { title: 'استلمنا اللقطات', detail: 'تم رفعها وفحصها', done: true },
    { title: 'المونتاج بالذكاء الاصطناعي', detail: `جاهز خلال ${tiers[order.tier].deliveryHours} ساعات تقريبًا`, done: false },
    { title: 'مراجعتك وموافقتك', detail: 'يصلك إشعار عندما يجهز', done: false },
    { title: 'النشر', detail: describeWhen(order.when), done: false },
    ...(order.promo !== 'none' ? [{ title: 'الترويج', detail: `${promoLevels[order.promo].name} لمدة ${order.promoDays} أيام`, done: false }] : []),
  ];

  return (
    <ScrollScreen
      header={<TopBar title="تم إرسال الطلب" mode="none" />}
      footer={
        <Button
          label="العودة للرئيسية"
          onPress={() => {
            startDraft('صوّر صحن الدولمة');
            router.dismissTo('/(tabs)');
          }}
        />
      }>
      <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(300)} style={[styles.ok, { backgroundColor: c.okSoft }]}>
        <Icon name="check" color={c.ok} size={22} strokeWidth={2.4} />
        <View style={ui.flex}>
          <AppText weight="semibold" size={15} color={c.ok}>
            طلبك قيد التنفيذ
          </AppText>
          <AppText size={12.5} color={c.ok} style={ui.tabular}>
            رقم الطلب {order.id}
          </AppText>
        </View>
      </Animated.View>

      <SectionTitle title="ماذا يحدث الآن" />
      <Card>
        {steps.map((s, i) => (
          <View key={s.title} style={styles.step}>
            <View style={styles.rail}>
              <View style={[styles.node, { backgroundColor: s.done ? c.ok : c.card, borderColor: s.done ? c.ok : c.lineStrong }]}>
                {s.done && <Icon name="check" color={c.card} size={11} strokeWidth={3} />}
              </View>
              {i < steps.length - 1 && <View style={[styles.line, { backgroundColor: c.line }]} />}
            </View>
            <View style={[ui.flex, styles.stepText]}>
              <AppText weight="medium" size={14.5}>
                {s.title}
              </AppText>
              <AppText size={12.5} color={c.muted}>
                {s.detail}
              </AppText>
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <KeyValue label="الإجمالي" value={formatIQD(order.reelPrice + order.promoCost)} strong />
        <AppText size={12} color={c.placeholder}>
          يُخصم عند موافقتك على الريل النهائي.
        </AppText>
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 2 },
  edit: { minHeight: 40, minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' },
  ok: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14 },
  step: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 18 },
  node: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  line: { width: 1.5, flex: 1, marginVertical: 2 },
  stepText: { paddingBottom: 16 },
});
