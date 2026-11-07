import { router, useIsFocused, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatIQD, lastDays, radius, tiers } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { HeroSurface, Monogram } from '@/components/brand';
import { Button } from '@/components/Button';
import { LineChart } from '@/components/charts';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Appear, Badge, Card, Chevron, IconBadge, IconButton, ListCard, ListRow, Progress, ScrollScreen, SectionTitle, GUTTER } from '@/components/ui';
import { OrderRow } from '@/features/services/OrderRow';
import { useServices } from '@/features/services/store';
import { useI18n } from '@/i18n';
import { useSession } from '@/state/session';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

// Today's date for the chart axis; read outside render so it stays pure.
const today = () => Date.now();

// Home for a real account: a navy hero with the setup progress and the
// headline metrics (empty until accounts are linked), shortcuts, the
// getting-started steps, and the latest orders the owner actually placed.
// Nothing here is sample data.
export default function HomeScreen() {
  const { c } = useTheme();
  const { L, lang } = useI18n();
  const { displayName, accountType, businessInfo } = useSession();
  const { orders, draft } = useStudio();
  const { jobs } = useServices();
  const creator = accountType === 'creator';

  const steps: { title: string; detail: string; done: boolean; href: Href; action?: string }[] = [
    { title: L('أنشئ حسابك', 'Create your account'), detail: L('تم التحقق من رقم هاتفك', 'Your phone number is verified'), done: true, href: '/account' },
    {
      title: creator ? L('عرّف بمحتواك', 'Describe your content') : L('أضف معلومات نشاطك', 'Add your business details'),
      detail: creator ? L('يساعد المساعد على اقتراح أفكار تناسبك', 'For ideas that fit you') : L('يساعد المساعد على الرد بدقة', 'For accurate replies'),
      done: businessInfo.trim().length > 0,
      href: '/account',
      action: L('أضف الآن', 'Add now'),
    },
    { title: L('اربط حساباتك', 'Link your accounts'), detail: L('إنستغرام وفيسبوك وتيك توك', 'Instagram, Facebook and TikTok'), done: false, href: '/account', action: L('اربط', 'Link') },
    {
      title: creator ? L('صوّر أول فيديو', 'Film your first video') : L('صوّر أول ريل', 'Film your first reel'),
      detail: L('نرشدك لقطةً بلقطة', 'We guide you shot by shot'),
      done: orders.length > 0,
      href: '/camera',
      action: L('ابدأ', 'Start'),
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const current = steps.findIndex((s) => !s.done);
  const latest = jobs.slice(0, 3);

  const quick: { icon: IconName; label: string; href: Href }[] = [
    { icon: 'camera', label: L('صوّر ريلًا', 'Shoot reel'), href: '/camera' },
    { icon: 'sparkle', label: L('اطلب خدمة', 'New order'), href: '/order' },
    { icon: creator ? 'handshake' : 'chat', label: creator ? L('التعاونات', 'Collabs') : L('الرسائل', 'Messages'), href: '/inbox' },
    { icon: creator ? 'bulb' : 'ads', label: creator ? L('الأفكار', 'Ideas') : L('الإعلانات', 'Ads'), href: '/ads' },
  ];

  return (
    <ScrollScreen inTabs bleed>
      <HomeHero name={displayName} steps={steps.length} done={doneCount} creator={creator} />

      <View style={styles.body}>
        <Appear order={1}>
          <View style={styles.quick}>
            {quick.map((q, i) => (
              <Card key={q.label} onPress={() => router.push(q.href)} accessibilityLabel={q.label} style={styles.qa}>
                <IconBadge icon={q.icon} tone={i === 0 ? 'solid' : 'pri'} size={40} />
                <AppText weight="medium" size={12} lineHeight={16} center numberOfLines={1}>
                  {q.label}
                </AppText>
              </Card>
            ))}
          </View>
        </Appear>

        {draft.active && (
          <Appear order={2}>
            <ListCard>
              <ListRow
                icon="video"
                iconTone="warn"
                title={draft.title}
                subtitle={L(`ريل قيد التصوير · اللقطات المصوّرة: ${draft.captured.length} من ${draft.shots.length}`, `Reel in progress · ${draft.captured.length} of ${draft.shots.length} shots filmed`)}
                onPress={() => router.push('/camera')}
                last
              />
              <View style={styles.draftBar}>
                <Progress value={draft.captured.length / draft.shots.length} />
              </View>
            </ListCard>
          </Appear>
        )}

        {doneCount < steps.length && (
          <Appear order={2}>
            <Card style={styles.steps}>
              <View style={styles.stepsHead}>
                <AppText variant="h3">{L('خطوات البدء', 'Getting started')}</AppText>
                <AppText variant="caption" color={c.muted}>
                  {L('نحو 5 دقائق', 'About 5 minutes')}
                </AppText>
              </View>
              {steps.map((s, i) => {
                const now = i === current;
                return (
                  <PressableScale
                    key={s.title}
                    accessibilityRole="button"
                    accessibilityLabel={s.title}
                    accessibilityState={{ checked: s.done }}
                    onPress={() => router.push(s.href)}
                    pressedScale={1}
                    style={[styles.step, i > 0 && { borderTopColor: c.line, borderTopWidth: 1 }]}>
                    <View style={[styles.stepNum, { backgroundColor: s.done ? c.okSoft : now ? c.primary : c.tile }]}>
                      {s.done ? (
                        <Icon name="check" color={c.ok} size={16} strokeWidth={2.2} />
                      ) : (
                        <AppText weight="bold" size={12.5} lineHeight={18} color={now ? c.onPrimary : c.muted}>
                          {i + 1}
                        </AppText>
                      )}
                    </View>
                    <View style={styles.flex}>
                      <AppText weight="semibold" size={14} lineHeight={20} color={s.done ? c.muted : c.text}>
                        {s.title}
                      </AppText>
                      <AppText variant="small" color={c.muted} numberOfLines={1}>
                        {s.detail}
                      </AppText>
                    </View>
                    {s.done ? (
                      <Badge label={L('تم', 'Done')} tone="ok" />
                    ) : now && s.action ? (
                      <Button small label={s.action} onPress={() => router.push(s.href)} />
                    ) : (
                      <Chevron size={18} />
                    )}
                  </PressableScale>
                );
              })}
            </Card>
          </Appear>
        )}

        <Appear order={3}>
          <Card style={styles.chartCard}>
            <View style={styles.between}>
              <View style={styles.flex}>
                <AppText variant="h3">{creator ? L('التفاعل اليومي', 'Daily engagement') : L('الطلبات اليومية', 'Daily orders')}</AppText>
                <AppText variant="small" color={c.muted}>
                  {L('آخر 7 أيام', 'Last 7 days')}
                </AppText>
              </View>
              <Badge label={L('لا بيانات بعد', 'No data yet')} />
            </View>
            <LineChart
              labels={lastDays(today(), 7, lang)}
              height={96}
              padTop={8}
              summary={L('لا توجد بيانات بعد', 'No data yet')}
              overlay={
                <View style={[styles.emptyPill, { backgroundColor: c.card, borderColor: c.line }]}>
                  <Icon name="chart" color={c.muted} size={16} />
                  <AppText variant="small" color={c.muted}>
                    {creator ? L('يظهر تفاعلك هنا بعد أول فيديو', 'Your engagement shows here after your first video') : L('ستظهر طلباتك هنا بعد أول إعلان', 'Your orders show here after your first ad')}
                  </AppText>
                </View>
              }
            />
          </Card>
        </Appear>

        {latest.length > 0 && (
          <>
            <SectionTitle title={L('أحدث الطلبات', 'Latest orders')} action={L('عرض الكل', 'See all')} onAction={() => router.push('/jobs')} />
            <ListCard>
              {latest.map((j, i) => (
                <OrderRow key={j.id} job={j} last={i === latest.length - 1} />
              ))}
            </ListCard>
          </>
        )}

        {orders.length > 0 && (
          <>
            <SectionTitle title={L('طلبات الريلز', 'Reel orders')} />
            <ListCard>
              {orders.slice(0, 3).map((o, i, arr) => (
                <ListRow
                  key={o.id}
                  icon="video"
                  title={o.title}
                  subtitle={`${L(tiers[o.tier].name.ar, tiers[o.tier].name.en)} · ⁦${o.id}⁩`}
                  trailing={
                    <View style={styles.end}>
                      <Badge label={L('قيد التنفيذ', 'In progress')} tone="warn" style={styles.badgeEnd} />
                      <AppText size={12.5} lineHeight={18} weight="semibold">
                        {formatIQD(o.reelPrice + o.promoCost)}
                      </AppText>
                    </View>
                  }
                  last={i === arr.length - 1}
                />
              ))}
            </ListCard>
          </>
        )}
      </View>
    </ScrollScreen>
  );
}

// The deep hero: brand row, welcome and setup progress, then the three
// headline metrics, which stay "—" until ad accounts are linked.
function HomeHero({ name, steps, done, creator }: { name: string | null; steps: number; done: number; creator: boolean }) {
  const { c } = useTheme();
  const { L } = useI18n();
  const insets = useSafeAreaInsets();
  // The hero is dark in every theme, so the status bar is light over it.
  const focused = useIsFocused();
  const metrics = creator
    ? [L('المتابعون', 'Followers'), L('المشاهدات', 'Views'), L('التفاعل', 'Engagement')]
    : [L('الطلبات', 'Orders'), L('الإنفاق الإعلاني', 'Ad spend'), L('نسبة الرد', 'Reply rate')];
  return (
    <HeroSurface style={[styles.hero, { paddingTop: insets.top + 8 }]}>
      {focused && <StatusBar style="light" />}
      <View style={styles.brandRow}>
        <Monogram size={38} onHero />
        <View style={styles.flex}>
          <AppText weight="bold" size={15} lineHeight={18} color={c.heroText} style={styles.wordmark}>
            SQ AI
          </AppText>
          {name && (
            <AppText size={12} lineHeight={17} color={c.heroMuted} numberOfLines={1}>
              {name}
            </AppText>
          )}
        </View>
        <IconButton icon="bell" label={L('الرسائل', 'Messages')} onHero onPress={() => router.push('/inbox')} />
      </View>

      <AppText variant="h2" color={c.heroText} style={styles.welcome}>
        {L('أهلًا بك في SQ AI', 'Welcome to SQ AI')}
      </AppText>
      <AppText variant="small" color={c.heroMuted}>
        {creator
          ? L('حسابك جاهز. أكمل الخطوات التالية لتنشر أول فيديو.', 'Your account is ready. Finish these steps to post your first video.')
          : L('حسابك جاهز. أكمل الخطوات التالية لتبدأ أول حملة.', 'Your account is ready. Finish these steps to launch your first campaign.')}
      </AppText>
      <View style={[styles.between, styles.setupHead]}>
        <AppText size={11} lineHeight={16} color={c.heroMuted}>
          {L('إعداد الحساب', 'Account setup')}
        </AppText>
        <AppText weight="medium" size={11} lineHeight={16} color={c.heroAccent} style={styles.ltr}>
          {`${done} / ${steps}`}
        </AppText>
      </View>
      <Progress value={done / steps} onHero />
      <View style={[styles.rule, { backgroundColor: c.heroLine }]} />
      <View style={styles.metrics}>
        {metrics.map((m, i) => (
          <View key={m} style={styles.metricWrap}>
            {i > 0 && <View style={[styles.vr, { backgroundColor: c.heroLine }]} />}
            <View style={styles.flex}>
              <AppText size={11} lineHeight={16} color={c.heroMuted} numberOfLines={1}>
                {m}
              </AppText>
              <AppText weight="semibold" size={15} lineHeight={22} color={c.heroMuted} accessibilityLabel={L('لا توجد بيانات بعد', 'No data yet')}>
                —
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </HeroSurface>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  ltr: { writingDirection: 'ltr' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hero: { paddingHorizontal: GUTTER, paddingBottom: 22, borderBottomLeftRadius: radius.hero, borderBottomRightRadius: radius.hero },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 56 },
  wordmark: { letterSpacing: 0.4, writingDirection: 'ltr', alignSelf: 'flex-start' },
  welcome: { marginTop: 4 },
  setupHead: { marginTop: 12, marginBottom: 6 },
  rule: { height: 1, marginTop: 14, marginBottom: 12 },
  metrics: { flexDirection: 'row' },
  metricWrap: { flex: 1, flexDirection: 'row', gap: 12 },
  vr: { width: 1, alignSelf: 'stretch', marginEnd: 0 },
  body: { paddingHorizontal: GUTTER, paddingTop: 4, gap: 12 },
  quick: { flexDirection: 'row', gap: 8 },
  qa: { flex: 1, alignItems: 'center', gap: 8, paddingTop: 12, paddingBottom: 10, paddingHorizontal: 4 },
  draftBar: { paddingHorizontal: 14, paddingBottom: 14, marginTop: -4 },
  steps: { paddingVertical: 4, gap: 0 },
  stepsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, paddingBottom: 2 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, minHeight: 56 },
  stepNum: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  chartCard: { paddingBottom: 10, gap: 6 },
  emptyPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  end: { alignItems: 'flex-end', gap: 4 },
  badgeEnd: { alignSelf: 'flex-end' },
});
