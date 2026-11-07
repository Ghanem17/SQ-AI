import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';

import { formatIQD, platformNames, promoLevels, promotionCost, reelPrice, tiers } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { SuccessSeal } from '@/components/brand';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Card, Divider, KeyValue, Note, ScrollScreen, SectionTitle, TopBar, ui } from '@/components/ui';
import { describeWhen } from '@/features/reel/when';
import { useI18n } from '@/i18n';
import { useStudio, type Order } from '@/state/studio';
import { useTheme } from '@/theme/theme';

// Final check before the order is placed, then a confirmation with the
// timeline of what happens next.
export default function SummaryScreen() {
  const { c } = useTheme();
  const { L, pick, lang, n } = useI18n();
  const { draft, placeOrder, automation } = useStudio();
  const [order, setOrder] = useState<Order | null>(null);
  const price = reelPrice(draft.tier);
  const promo = promotionCost(draft.promo, draft.promoDays);
  const filmed = draft.captured.length;

  if (order) return <Placed order={order} />;

  return (
    <ScrollScreen
      header={<TopBar title={L('مراجعة الطلب', 'Review order')} subtitle={draft.title} />}
      footer={
        <>
          <View style={ui.between}>
            <AppText size={13} color={c.muted}>
              {L('الإجمالي', 'Total')}
            </AppText>
            <AppText weight="bold" size={20} lineHeight={28}>
              {formatIQD(price + promo)}
            </AppText>
          </View>
          {filmed > 0 ? (
            <Button label={L('أكّد الطلب', 'Confirm order')} icon="check" onPress={() => setOrder(placeOrder())} />
          ) : (
            <Button label={L('صوّر اللقطات أولًا', 'Film the shots first')} icon="camera" onPress={() => router.navigate('/camera')} />
          )}
        </>
      }>
      {filmed === 0 && (
        <Note tone="acc" icon="camera">
          {L('صوّر لقطة واحدة على الأقل قبل تأكيد الطلب.', 'Film at least one shot before confirming the order.')}
        </Note>
      )}
      <Card>
        <Row
          label={L('اللقطات', 'Shots')}
          value={filmed > 0 ? L(`${filmed} من ${draft.shots.length}`, `${filmed} of ${draft.shots.length}`) : L('لم تُصوَّر أي لقطة بعد', 'No shots filmed yet')}
          onEdit={() => router.navigate('/camera')}
        />
        <Divider />
        <Row label={L('الجودة', 'Quality')} value={`${pick(tiers[draft.tier].name)} · ${tiers[draft.tier].resolution}`} onEdit={() => router.navigate('/reel/quality')} />
        <Divider />
        <Row label={L('المنصات', 'Platforms')} value={draft.platforms.map((p) => pick(platformNames[p])).join(L('، ', ', '))} onEdit={() => router.navigate('/reel/publish')} />
        <Divider />
        <Row label={L('وقت النشر', 'Posting time')} value={describeWhen(draft.when, lang)} onEdit={() => router.navigate('/reel/publish')} />
        <Divider />
        <Row
          label={L('الترويج', 'Promotion')}
          value={
            draft.promo === 'none'
              ? L('دون ترويج', 'No promotion')
              : `${pick(promoLevels[draft.promo].name)} · ${n(draft.promoDays, 'day')}`
          }
          onEdit={() => router.navigate('/reel/promote')}
        />
      </Card>

      <SectionTitle title={L('التكلفة', 'Cost')} action={L('لماذا هذا السعر؟', 'Why this price?')} onAction={() => router.push({ pathname: '/reel/receipt', params: { tier: draft.tier } })} />
      <Card>
        <KeyValue label={L(`ريل ${tiers[draft.tier].name.ar}`, `${tiers[draft.tier].name.en} reel`)} value={formatIQD(price)} />
        {draft.promo !== 'none' && <KeyValue divider label={L('ميزانية الترويج', 'Promotion budget')} sub={L('تُدفع إلى منصة الإعلان', 'Paid to the ad platform')} value={formatIQD(promo)} />}
        <KeyValue divider icon="receipt" label={L('الإجمالي', 'Total')} value={formatIQD(price + promo)} strong />
      </Card>

      <Note icon="shield">
        {automation.approval === 'ask'
          ? L('نرسل إليك الريل النهائي للموافقة قبل النشر، ولا يُخصم شيء قبل موافقتك.', 'We send you the final reel to approve before posting; nothing is charged before you approve.')
          : L(
              'الموافقة التلقائية مفعّلة: يُنشر الريل مباشرة بعد المونتاج. يمكنك تغيير ذلك من الوضع التلقائي.',
              'Auto-approval is on: the reel posts right after editing. Change this in Autopilot.',
            )}
      </Note>
    </ScrollScreen>
  );
}

function Row({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  const { c } = useTheme();
  const { L } = useI18n();
  return (
    <View style={styles.row}>
      <View style={ui.flex}>
        <AppText size={12.5} color={c.muted}>
          {label}
        </AppText>
        <AppText size={14} lineHeight={21} weight="semibold">
          {value}
        </AppText>
      </View>
      <PressableScale accessibilityRole="button" accessibilityLabel={L(`تعديل ${label}`, `Edit ${label}`)} onPress={onEdit} style={styles.edit}>
        <Icon name="edit" color={c.muted} size={16} />
      </PressableScale>
    </View>
  );
}

function Placed({ order }: { order: Order }) {
  const { c } = useTheme();
  const { L, lang, n } = useI18n();
  const { clearDraft } = useStudio();
  const reduceMotion = useReducedMotion();
  const steps = [
    { title: L('اللقطات جاهزة', 'Shots ready'), detail: L('صُوّرت على هذا الجهاز', 'Filmed on this device'), done: true },
    {
      title: L('المونتاج بالذكاء الاصطناعي', 'AI editing'),
      detail: L(`مدة التجهيز: ${n(tiers[order.tier].deliveryHours, 'hour')} تقريبًا`, `Ready in about ${n(tiers[order.tier].deliveryHours, 'hour')}`),
      done: false,
    },
    { title: L('مراجعتك وموافقتك', 'Your review and approval'), detail: L('يصلك إشعار عندما يجهز', 'You get a notice when it is ready'), done: false },
    { title: L('النشر', 'Posting'), detail: describeWhen(order.when, lang), done: false },
    ...(order.promo !== 'none'
      ? [
          {
            title: L('الترويج', 'Promotion'),
            detail: L(`${promoLevels[order.promo].name.ar} · المدة: ${n(order.promoDays, 'day')}`, `${promoLevels[order.promo].name.en} for ${n(order.promoDays, 'day')}`),
            done: false,
          },
        ]
      : []),
  ];

  return (
    <ScrollScreen
      header={<TopBar title={L('أُرسل الطلب', 'Order sent')} mode="none" />}
      footer={
        <Button
          label={L('العودة إلى الرئيسية', 'Back to home')}
          onPress={() => {
            clearDraft();
            router.dismissTo('/');
          }}
        />
      }>
      <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(300)} style={styles.ok}>
        <SuccessSeal />
        <AppText variant="h2" center style={styles.okTitle}>
          {L('طلبك قيد التنفيذ', 'Your order is in progress')}
        </AppText>
        <AppText variant="small" color={c.muted} center>
          {L(`رقم الطلب ⁦${order.id}⁩`, `Order ${order.id}`)}
        </AppText>
      </Animated.View>

      <SectionTitle title={L('ماذا يحدث الآن', 'What happens now')} />
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
              <AppText variant="rowTitle">
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
        <KeyValue label={L('الإجمالي', 'Total')} value={formatIQD(order.reelPrice + order.promoCost)} strong />
        <AppText size={12} color={c.placeholder}>
          {L('يُخصم عند موافقتك على الريل النهائي.', 'Charged when you approve the final reel.')}
        </AppText>
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 2 },
  edit: { minHeight: 40, minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' },
  ok: { alignItems: 'center', gap: 2, paddingTop: 8 },
  okTitle: { marginTop: 10 },
  step: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 18 },
  node: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  line: { width: 1.5, flex: 1, marginVertical: 2 },
  stepText: { paddingBottom: 16 },
});
