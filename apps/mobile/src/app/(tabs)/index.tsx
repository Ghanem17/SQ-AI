import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatIQD, formatNumber, serviceOrder, services, tiers, type ServiceKind } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Appear, Avatar, Card, ListRow, Progress, ScrollScreen, SectionTitle, ui } from '@/components/ui';
import { starterShots } from '@/features/reel/shots';
import { useI18n, type I18n } from '@/i18n';
import { useServices } from '@/features/services/store';
import { useSession } from '@/state/session';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

function greeting(L: I18n['L']): string {
  const h = new Date().getHours();
  if (h < 12) return L('صباح الخير', 'Good morning');
  if (h < 18) return L('طاب يومك', 'Good afternoon');
  return L('مساء الخير', 'Good evening');
}

// Home for a real account: what to do next, and real numbers only once
// there are some. Nothing here is sample data.
export default function HomeScreen() {
  const { c } = useTheme();
  const { L, pick, lang } = useI18n();
  const { displayName, accountType, businessInfo } = useSession();
  const { orders, plan, automation, spentThisMonth, draft, startDraft } = useStudio();
  const creator = accountType === 'creator';
  const name = displayName ?? L('حسابي', 'My account');
  const { jobs } = useServices();
  const serviceIcons: Record<ServiceKind, IconName> = { editVideo: 'video', adImage: 'camera', textVideo: 'sparkle', copy: 'edit', voice: 'mic' };

  const steps: { done: boolean; icon: IconName; title: string; detail: string; go: () => void }[] = [
    {
      done: businessInfo.trim().length > 0,
      icon: creator ? 'user' : 'store',
      title: creator ? L('عرّف بمحتواك', 'Describe your content') : L('اكتب معلومات نشاطك', 'Describe your business'),
      detail: creator
        ? L('مجالك وجمهورك، ليقترح المساعد أفكارًا تناسبك', 'Your niche and audience, so the assistant suggests ideas that fit')
        : L('الأصناف والأسعار ومناطق التوصيل، ليرد المساعد على عملائك بدقة', 'Items, prices and delivery areas, so the assistant answers customers accurately'),
      go: () => router.push('/settings'),
    },
    {
      done: orders.length > 0,
      icon: 'camera',
      title: L('صوّر أول ريل', 'Film your first reel'),
      detail: L('اطلب فكرة من المساعد أو ابدأ بقائمة لقطات جاهزة', 'Ask the assistant for an idea or start from a ready shot list'),
      go: () => router.push('/(tabs)/camera'),
    },
    {
      done: plan.active,
      icon: 'calendar',
      title: L('فعّل خطة شهرية', 'Turn on a monthly plan'),
      detail: L('ريلز مجدولة طوال الشهر بسعر أقل للريل الواحد', 'Reels scheduled all month at a lower price per reel'),
      go: () => router.push('/plan'),
    },
    {
      done: false,
      icon: 'globe',
      title: L('اربط إنستغرام وفيسبوك وواتساب', 'Link Instagram, Facebook and WhatsApp'),
      detail: L('للنشر والرد على الرسائل وقياس النتائج، ويتوفر مع تشغيل الخادم', 'To post, answer messages and measure results, once the server runs'),
      go: () => router.push('/settings'),
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <ScrollScreen inTabs>
      <View style={styles.header}>
        <View style={ui.flex}>
          <AppText size={12.5} color={c.muted}>
            {greeting(L)}
          </AppText>
          <AppText weight="semibold" size={20} lineHeight={28} numberOfLines={1}>
            {name}
          </AppText>
        </View>
        <PressableScale accessibilityRole="button" accessibilityLabel={L('الحساب والإعدادات', 'Account and settings')} onPress={() => router.push('/settings')}>
          <Avatar name={name} size={40} />
        </PressableScale>
      </View>

      <Appear order={1}>
        <Card tone="hero">
          <AppText weight="medium" size={12.5} color={c.heroMuted}>
            {draft.active ? L('ريل قيد التصوير', 'Reel in progress') : L('ابدأ من هنا', 'Start here')}
          </AppText>
          <AppText weight="semibold" size={20} lineHeight={28} color={c.heroText}>
            {draft.active ? draft.title : creator ? L('ماذا ستصوّر اليوم؟', 'What will you film today?') : L('أول ريل لنشاطك', 'Your first reel')}
          </AppText>
          <AppText size={13} color={c.heroMuted}>
            {draft.active
              ? L(`صوّرت ${draft.captured.length} من ${draft.shots.length} لقطات`, `${draft.captured.length} of ${draft.shots.length} shots filmed`)
              : L('يقترح المساعد فكرة ويحوّلها إلى قائمة لقطات، وترشدك الكاميرا لقطةً لقطة.', 'The assistant suggests an idea and turns it into shots; the camera guides you shot by shot.')}
          </AppText>
          {draft.active && <Progress value={draft.captured.length / draft.shots.length} onHero />}
          <View style={styles.heroActions}>
            <Button label={L('اقترح فكرة', 'Get ideas')} icon="sparkle" variant="hero" height={44} style={ui.flex} onPress={() => router.push('/assistant')} />
            <Button
              label={draft.active ? L('تابع التصوير', 'Keep filming') : L('ابدأ التصوير', 'Start filming')}
              icon="camera"
              height={44}
              style={ui.flex}
              colors={{ bg: 'rgba(255,255,255,0.1)', fg: c.heroText }}
              onPress={() => {
                if (!draft.active) startDraft(creator ? L('فيديو جديد', 'New video') : L('ريل جديد', 'New reel'), starterShots(creator ? 'creator' : 'shop', lang));
                router.push('/(tabs)/camera');
              }}
            />
          </View>
        </Card>
      </Appear>

      <SectionTitle
        title={L('خدمات منفردة · دون اشتراك', 'One-off services · no subscription')}
        action={jobs.length ? L(`طلباتك (${jobs.length})`, `Your orders (${jobs.length})`) : undefined} onAction={() => router.push('/jobs')} />
      <Appear order={2}>
        <Card style={styles.servicesCard}>
          <AppText size={12.5} color={c.muted} lineHeight={19}>
            {L(
              'أخبر المساعد بما تريد، واختر مستوى منخفضًا أو متوسطًا أو عاليًا، وسترى النماذج المستخدمة وتكلفة كل منها قبل أن تدفع.',
              'Tell the assistant what you need, pick a low, medium or high level, and see every model and its cost before you pay.',
            )}
          </AppText>
          <View style={styles.servicesGrid}>
            {serviceOrder.map((k) => (
              <PressableScale
                key={k}
                accessibilityRole="button"
                accessibilityLabel={pick(services[k].name)}
                onPress={() => router.push({ pathname: '/order', params: { service: k } })}
                style={[styles.service, { backgroundColor: c.tile }]}>
                <View style={[styles.serviceIcon, { backgroundColor: c.card }]}>
                  <Icon name={serviceIcons[k]} color={c.primary} size={18} />
                </View>
                <AppText weight="semibold" size={13.5}>
                  {pick(services[k].name)}
                </AppText>
                <AppText size={11.5} color={c.muted} lineHeight={16} numberOfLines={2}>
                  {pick(services[k].pitch)}
                </AppText>
              </PressableScale>
            ))}
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={L('اطلب أي خدمة', 'Ask for anything')}
              onPress={() => router.push('/order')}
              style={[styles.service, { backgroundColor: c.hero }]}>
              <View style={[styles.serviceIcon, { backgroundColor: c.heroBtn }]}>
                <Icon name="chat" color={c.heroBtnText} size={18} />
              </View>
              <AppText weight="semibold" size={13.5} color={c.heroText}>
                {L('اطلب أي خدمة', 'Ask for anything')}
              </AppText>
              <AppText size={11.5} color={c.heroMuted} lineHeight={16} numberOfLines={2}>
                {L('صف طلبك بكلماتك وسيفهمه المساعد', 'Describe it in your words and the assistant gets it')}
              </AppText>
            </PressableScale>
          </View>
        </Card>
      </Appear>

      <Appear order={2}>
        <Card>
          <View style={ui.between}>
            <AppText weight="semibold" size={15}>
              {L('خطوات البداية', 'Getting started')}
            </AppText>
            <AppText size={12.5} color={c.muted} style={ui.tabular}>
              {L(`${doneCount} من ${steps.length}`, `${doneCount} of ${steps.length}`)}
            </AppText>
          </View>
          <Progress value={doneCount / steps.length} />
          <View>
            {steps.map((s, i) => (
              <PressableScale
                key={s.title}
                accessibilityRole="button"
                accessibilityLabel={s.title}
                accessibilityState={{ checked: s.done }}
                onPress={s.go}
                pressedScale={1}
                style={[styles.step, i < steps.length - 1 && { borderBottomColor: c.line, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <View style={[styles.stepIcon, { backgroundColor: s.done ? c.okSoft : c.tile }]}>
                  <Icon name={s.done ? 'check' : s.icon} color={s.done ? c.ok : c.text} size={16} strokeWidth={s.done ? 2.4 : 1.8} />
                </View>
                <View style={ui.flex}>
                  <AppText weight="medium" size={14} color={s.done ? c.muted : c.text}>
                    {s.title}
                  </AppText>
                  <AppText size={12} color={c.muted}>
                    {s.detail}
                  </AppText>
                </View>
                {!s.done && <Icon name="chevronLeft" color={c.placeholder} size={18} />}
              </PressableScale>
            ))}
          </View>
        </Card>
      </Appear>

      <Appear order={3}>
        <Card onPress={() => router.push('/automation')} accessibilityLabel={L('الوضع التلقائي', 'Autopilot')} style={styles.strip}>
          <View style={[styles.stripIcon, { backgroundColor: automation.enabled ? c.okSoft : c.tile }]}>
            <Icon name="bolt" color={automation.enabled ? c.ok : c.muted} size={16} strokeWidth={2} />
          </View>
          <View style={ui.flex}>
            <AppText weight="medium" size={13.5}>
              {automation.enabled ? L('الوضع التلقائي يعمل', 'Autopilot is on') : L('الوضع التلقائي متوقف', 'Autopilot is off')}
            </AppText>
            <AppText size={12} color={c.muted} style={ui.tabular}>
              {L(`صُرف ${formatNumber(spentThisMonth)} من ${formatIQD(automation.monthlyCap)} هذا الشهر`, `${formatNumber(spentThisMonth)} of ${formatIQD(automation.monthlyCap)} spent this month`)}
            </AppText>
          </View>
          <Icon name="chevronLeft" color={c.placeholder} size={18} />
        </Card>
      </Appear>

      <SectionTitle title={creator ? L('المتابعون والتفاعل', 'Followers and engagement') : L('الطلبات والرسائل', 'Orders and messages')} />
      <Card style={styles.empty}>
        <View style={[styles.emptyIcon, { backgroundColor: c.tile }]}>
          <Icon name="chart" color={c.muted} size={20} />
        </View>
        <AppText weight="medium" size={14.5} center>
          {L('لا توجد أرقام بعد', 'No numbers yet')}
        </AppText>
        <AppText size={12.5} color={c.muted} center lineHeight={19}>
          {creator
            ? L('بعد نشر أول فيديو وربط حساباتك، تظهر هنا المشاهدات والمتابعون الجدد والتفاعل.', 'After your first video and linked accounts, views, new followers and engagement show here.')
            : L('بعد نشر أول ريل وربط حساباتك، تظهر هنا الطلبات ونسبة الرد وتكلفة كل طلب.', 'After your first reel and linked accounts, orders, reply rate and cost per order show here.')}
        </AppText>
        <Button label={L('جرّب المساعد مع عميل', 'Try the assistant with a customer')} variant="secondary" height={42} icon="chat" onPress={() => router.push('/test-chat')} />
      </Card>

      {orders.length > 0 && (
        <>
          <SectionTitle title={L('طلباتك', 'Your orders')} />
          <Card style={styles.list}>
            {orders.slice(0, 5).map((o, i, arr) => (
              <ListRow
                key={o.id}
                icon="video"
                title={o.title}
                subtitle={`${pick(tiers[o.tier].name)} · ${L('قيد التنفيذ', 'In progress')}`}
                trailing={formatIQD(o.reelPrice + o.promoCost)}
                last={i === arr.length - 1}
              />
            ))}
          </Card>
        </>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  heroActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, minHeight: 56 },
  stepIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  strip: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  stripIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 22 },
  emptyIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  list: { paddingVertical: 2, gap: 0 },
  servicesCard: { gap: 12 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  service: { width: '48.5%', borderRadius: 12, padding: 12, gap: 4, minHeight: 112 },
  serviceIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
});
