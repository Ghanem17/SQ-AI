import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatIQD, formatNumber, formatPercent, platformNames, reelPrice, tiers } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Columns } from '@/components/charts';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Appear, Avatar, Badge, Card, ListRow, Progress, ScrollScreen, SectionTitle, Stat, ui } from '@/components/ui';
import { collabs, conversations, ideas, todayShots } from '@/mock/data';
import { sampleCreator, sampleToday } from '@/mock/today';
import { useSession } from '@/state/session';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

export default function TodayScreen() {
  const { accountType } = useSession();
  return <ScrollScreen inTabs>{accountType === 'creator' ? <CreatorHome /> : <ShopHome />}</ScrollScreen>;
}

function Header({ overline, name }: { overline: string; name: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.header}>
      <View style={ui.flex}>
        <AppText size={12.5} color={c.muted}>
          {overline}
        </AppText>
        <AppText weight="semibold" size={20} lineHeight={28} numberOfLines={1}>
          {name}
        </AppText>
      </View>
      <PressableScale accessibilityRole="button" accessibilityLabel="الحساب والإعدادات" onPress={() => router.push('/settings')}>
        <Avatar name={name} size={40} />
      </PressableScale>
    </View>
  );
}

function AutomationStrip() {
  const { c } = useTheme();
  const { automation, spentThisMonth } = useStudio();
  return (
    <Card onPress={() => router.push('/automation')} accessibilityLabel="الوضع التلقائي" style={styles.strip}>
      <View style={[styles.stripIcon, { backgroundColor: automation.enabled ? c.okSoft : c.tile }]}>
        <Icon name="bolt" color={automation.enabled ? c.ok : c.muted} size={16} strokeWidth={2} />
      </View>
      <View style={ui.flex}>
        <AppText weight="medium" size={13.5}>
          {automation.enabled ? 'الوضع التلقائي يعمل' : 'الوضع التلقائي متوقف'}
        </AppText>
        <AppText size={12} color={c.muted} style={ui.tabular}>
          صُرف {formatNumber(spentThisMonth)} من {formatIQD(automation.monthlyCap)} هذا الشهر
        </AppText>
      </View>
      <Icon name="chevronLeft" color={c.placeholder} size={18} />
    </Card>
  );
}

function PlanCard() {
  const { c } = useTheme();
  const { plan, orders } = useStudio();
  if (!plan.active) {
    return (
      <Card onPress={() => router.push('/plan')} accessibilityLabel="أنشئ خطة شهرية" style={styles.strip}>
        <View style={[styles.stripIcon, { backgroundColor: c.priSoft }]}>
          <Icon name="calendar" color={c.onPriSoft} size={16} />
        </View>
        <View style={ui.flex}>
          <AppText weight="medium" size={13.5}>
            أنشئ خطة شهرية
          </AppText>
          <AppText size={12} color={c.muted}>
            ريلز مجدولة طوال الشهر بسعر أقل للريل
          </AppText>
        </View>
        <Icon name="chevronLeft" color={c.placeholder} size={18} />
      </Card>
    );
  }
  const done = 3 + orders.length;
  return (
    <Card onPress={() => router.push('/plan')} accessibilityLabel="الخطة الشهرية">
      <View style={ui.between}>
        <AppText weight="medium" size={13.5}>
          الخطة الشهرية
        </AppText>
        <AppText size={12.5} color={c.muted} style={ui.tabular}>
          {Math.min(done, plan.reels)} من {plan.reels} ريلز
        </AppText>
      </View>
      <Progress value={done / plan.reels} />
      <AppText size={12} color={c.muted}>
        الريل القادم: الأحد، {tiers[plan.tier].name}
      </AppText>
    </Card>
  );
}

function ShopHome() {
  const { c } = useTheme();
  const { displayName } = useSession();
  const { orders, startDraft } = useStudio();
  const d = sampleToday;
  const name = displayName ?? d.greetingName;
  const needStaff = conversations.filter((x) => x.tag === 'needsStaff');

  return (
    <>
      <Header overline="صباح الخير" name={name} />

      <Appear order={1}>
        <Card tone="hero">
          <View style={ui.between}>
            <AppText weight="medium" size={12.5} color={c.heroMuted}>
              مهمة اليوم
            </AppText>
            <AppText size={12.5} color={c.heroMuted} style={ui.tabular}>
              لقطة {d.task.shotsDone} من {d.task.shotsTotal}
            </AppText>
          </View>
          <AppText weight="semibold" size={20} lineHeight={28} color={c.heroText}>
            {d.task.title}
          </AppText>
          <AppText size={13} color={c.heroMuted}>
            {d.task.hint}
          </AppText>
          <Progress value={d.task.shotsDone / d.task.shotsTotal} onHero />
          <View style={styles.heroActions}>
            <Button
              label="ابدأ التصوير"
              icon="camera"
              variant="hero"
              height={44}
              style={ui.flex}
              onPress={() => {
                startDraft(d.task.title);
                router.push('/(tabs)/camera');
              }}
            />
            <Button label="اسأل المساعد" icon="sparkle" height={44} colors={{ bg: 'rgba(255,255,255,0.1)', fg: c.heroText }} onPress={() => router.push('/assistant')} />
          </View>
        </Card>
      </Appear>

      <Appear order={2}>
        <Card>
          <View style={styles.statRow}>
            <Stat label="كلفة الطلب" value={formatNumber(d.costPerOrder)} unit="د.ع" delta={`↓ ${formatPercent(d.costChangePercent)} عن الشهر الماضي`} good />
            <View style={[styles.vline, { backgroundColor: c.line }]} />
            <Stat label="طلبات اليوم" value={formatNumber(d.ordersToday)} delta="↑ 3 عن أمس" good />
          </View>
          <View style={[styles.hline, { backgroundColor: c.line }]} />
          <View style={styles.statRow}>
            <Stat label="نسبة الرد" value={formatPercent(d.replyRate)} delta="خلال دقيقة واحدة" good />
            <View style={[styles.vline, { backgroundColor: c.line }]} />
            <Stat label="صرف الإعلانات اليوم" value={formatNumber(17000)} unit="د.ع" delta="ضمن السقف" good />
          </View>
        </Card>
      </Appear>

      <Appear order={3}>
        <AutomationStrip />
      </Appear>

      <SectionTitle title="بانتظار موافقتك" />
      <Appear order={4}>
        <Card onPress={() => router.push('/reel/review')} accessibilityLabel="راجع الريل">
          <View style={styles.reelRow}>
            <View style={[styles.thumb, { backgroundColor: c.hero }]}>
              <Icon name="play" color={c.heroText} size={18} />
              <AppText size={10.5} color={c.heroMuted} style={styles.thumbTime}>
                0:15
              </AppText>
            </View>
            <View style={[ui.flex, ui.gap8]}>
              <AppText weight="semibold" size={15}>
                {d.pendingReel?.title}
              </AppText>
              <AppText size={12.5} color={c.muted}>
                {d.pendingReel?.platforms.map((p) => platformNames[p]).join('، ')} · احترافي
              </AppText>
              <Badge label="جاهز للمراجعة" tone="acc" />
            </View>
            <Icon name="chevronLeft" color={c.placeholder} size={18} />
          </View>
        </Card>
      </Appear>

      <SectionTitle title="الرسائل" action="عرض الكل" onAction={() => router.push('/(tabs)/inbox')} />
      <Appear order={5}>
        <Card style={styles.listCard}>
          {needStaff.map((x, i) => (
            <ListRow
              key={x.id}
              leading={<Avatar name={x.name} size={36} />}
              title={x.name}
              subtitle={x.lastMessage}
              trailing={<Badge label="يحتاج موظفًا" tone="bad" />}
              onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: x.id } })}
              chevron={false}
              last={i === needStaff.length - 1}
            />
          ))}
          <ListRow
            icon="sparkle"
            title="المساعد رد على 38 رسالة اليوم"
            subtitle="سجّل 11 طلبًا وحجزين"
            onPress={() => router.push('/(tabs)/inbox')}
            last
          />
        </Card>
      </Appear>

      <Appear order={6}>
        <PlanCard />
      </Appear>

      {orders.length > 0 && (
        <>
          <SectionTitle title="طلباتك الأخيرة" />
          <Card style={styles.listCard}>
            {orders.slice(0, 3).map((o, i, arr) => (
              <ListRow
                key={o.id}
                icon="video"
                title={o.title}
                subtitle={`${tiers[o.tier].name} · ${o.id}`}
                trailing={formatIQD(o.reelPrice + o.promoCost)}
                last={i === arr.length - 1}
              />
            ))}
          </Card>
        </>
      )}

      <AppText size={11.5} color={c.placeholder} center style={styles.sample}>
        بيانات تجريبية · سعر الريل الاحترافي {formatIQD(reelPrice('pro'))}
      </AppText>
    </>
  );
}

function CreatorHome() {
  const { c } = useTheme();
  const { displayName } = useSession();
  const { startDraft } = useStudio();
  const d = sampleCreator;
  const name = displayName ?? d.name;
  const offer = collabs.find((k) => k.status === 'new');

  return (
    <>
      <Header overline={d.niche} name={name} />

      <Appear order={1}>
        <Card tone="hero">
          <AppText weight="medium" size={12.5} color={c.heroMuted}>
            فكرة اليوم
          </AppText>
          <AppText weight="semibold" size={20} lineHeight={28} color={c.heroText}>
            {d.idea.title}
          </AppText>
          <AppText size={13} color={c.heroMuted}>
            {d.idea.hook}
          </AppText>
          <View style={styles.heroActions}>
            <Button
              label="صوّر الفكرة"
              icon="camera"
              variant="hero"
              height={44}
              style={ui.flex}
              onPress={() => {
                startDraft(d.idea.title);
                router.push('/(tabs)/camera');
              }}
            />
            <Button label="أفكار أخرى" icon="bulb" height={44} colors={{ bg: 'rgba(255,255,255,0.1)', fg: c.heroText }} onPress={() => router.push('/(tabs)/ads')} />
          </View>
        </Card>
      </Appear>

      <Appear order={2}>
        <Card>
          <View style={styles.statRow}>
            <Stat label="متابعون جدد" value={`\u2066+${formatNumber(d.newFollowers)}\u2069`} delta="هذا الأسبوع" good />
            <View style={[styles.vline, { backgroundColor: c.line }]} />
            <Stat label="التفاعل" value={`${d.engagement}%`} delta="↑ 0.9 نقطة" good />
          </View>
          <View style={[styles.hline, { backgroundColor: c.line }]} />
          <View style={styles.statRow}>
            <Stat label="المشاهدات" value={d.views} delta="آخر 7 أيام" good />
            <View style={[styles.vline, { backgroundColor: c.line }]} />
            <View style={[ui.flex, ui.gap8]}>
              <AppText size={12.5} color={c.muted}>
                المشاهدات اليومية
              </AppText>
              <Columns values={[18, 22, 19, 31, 27, 24, 41]} height={38} />
            </View>
          </View>
        </Card>
      </Appear>

      <Appear order={3}>
        <AutomationStrip />
      </Appear>

      {offer && (
        <>
          <SectionTitle title="عرض تعاون جديد" action="كل العروض" onAction={() => router.push('/(tabs)/inbox')} />
          <Appear order={4}>
            <Card>
              <View style={ui.between}>
                <AppText weight="semibold" size={15}>
                  {offer.brand}
                </AppText>
                <AppText weight="semibold" size={15} style={ui.tabular}>
                  {formatIQD(offer.price)}
                </AppText>
              </View>
              <AppText size={12.5} color={c.muted}>
                {offer.scope} · {offer.deadline}
              </AppText>
              <View style={styles.heroActions}>
                <Button label="اقبل العرض" height={42} style={ui.flex} onPress={() => router.push('/(tabs)/inbox')} />
                <Button label="التفاصيل" variant="secondary" height={42} style={ui.flex} onPress={() => router.push('/(tabs)/inbox')} />
              </View>
            </Card>
          </Appear>
        </>
      )}

      <SectionTitle title="مقترحة لك" action="الكل" onAction={() => router.push('/(tabs)/ads')} />
      <Card style={styles.listCard}>
        {ideas.slice(1, 3).map((idea, i, arr) => (
          <ListRow key={idea.id} icon="bulb" title={idea.title} subtitle={idea.why} onPress={() => router.push('/(tabs)/ads')} last={i === arr.length - 1} />
        ))}
      </Card>

      <Appear order={6}>
        <PlanCard />
      </Appear>

      <AppText size={11.5} color={c.placeholder} center style={styles.sample}>
        بيانات تجريبية · {todayShots.length} لقطات لكل فكرة في المتوسط
      </AppText>
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  heroActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  statRow: { flexDirection: 'row', alignItems: 'stretch', gap: 14 },
  vline: { width: StyleSheet.hairlineWidth },
  hline: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  strip: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  stripIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  reelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 58, height: 82, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  thumbTime: { position: 'absolute', bottom: 4, start: 6 },
  listCard: { paddingVertical: 2, gap: 0 },
  sample: { marginTop: 8 },
});
