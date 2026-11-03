import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatIQD, formatNumber, tiers } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Appear, Avatar, Card, ListRow, Progress, ScrollScreen, SectionTitle, ui } from '@/components/ui';
import { starterShots } from '@/features/reel/shots';
import { useSession } from '@/state/session';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'صباح الخير';
  if (h < 18) return 'نهارك سعيد';
  return 'مساء الخير';
}

// Home for a real account: what to do next, and real numbers only once
// there are some. Nothing here is sample data.
export default function HomeScreen() {
  const { c } = useTheme();
  const { displayName, accountType, businessInfo } = useSession();
  const { orders, plan, automation, spentThisMonth, draft, startDraft } = useStudio();
  const creator = accountType === 'creator';
  const name = displayName ?? 'حسابي';

  const steps: { done: boolean; icon: IconName; title: string; detail: string; go: () => void }[] = [
    {
      done: businessInfo.trim().length > 0,
      icon: creator ? 'user' : 'store',
      title: creator ? 'عرّف عن محتواك' : 'اكتب معلومات محلك',
      detail: creator ? 'مجالك وجمهورك، ليقترح المساعد أفكارًا تناسبك' : 'الأصناف والأسعار ومناطق التوصيل، ليرد المساعد على زبائنك بدقة',
      go: () => router.push('/settings'),
    },
    {
      done: orders.length > 0,
      icon: 'camera',
      title: 'صوّر أول ريل',
      detail: 'اطلب فكرة من المساعد أو ابدأ بقائمة لقطات جاهزة',
      go: () => router.push('/(tabs)/camera'),
    },
    {
      done: plan.active,
      icon: 'calendar',
      title: 'فعّل خطة شهرية',
      detail: 'ريلز مجدولة طوال الشهر بسعر أقل للريل',
      go: () => router.push('/plan'),
    },
    {
      done: false,
      icon: 'globe',
      title: 'اربط إنستغرام وفيسبوك وواتساب',
      detail: 'للنشر والرد على الرسائل وقياس النتائج، يتوفر مع تشغيل السيرفر',
      go: () => router.push('/settings'),
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <ScrollScreen inTabs>
      <View style={styles.header}>
        <View style={ui.flex}>
          <AppText size={12.5} color={c.muted}>
            {greeting()}
          </AppText>
          <AppText weight="semibold" size={20} lineHeight={28} numberOfLines={1}>
            {name}
          </AppText>
        </View>
        <PressableScale accessibilityRole="button" accessibilityLabel="الحساب والإعدادات" onPress={() => router.push('/settings')}>
          <Avatar name={name} size={40} />
        </PressableScale>
      </View>

      <Appear order={1}>
        <Card tone="hero">
          <AppText weight="medium" size={12.5} color={c.heroMuted}>
            {draft.active ? 'ريل قيد التصوير' : 'ابدأ من هنا'}
          </AppText>
          <AppText weight="semibold" size={20} lineHeight={28} color={c.heroText}>
            {draft.active ? draft.title : creator ? 'شو تصوّر اليوم؟' : 'أول ريل لمحلك'}
          </AppText>
          <AppText size={13} color={c.heroMuted}>
            {draft.active
              ? `صوّرت ${draft.captured.length} من ${draft.shots.length} لقطات`
              : 'المساعد يقترح فكرة ويحوّلها لقائمة لقطات، والكاميرا توجّهك لقطة لقطة.'}
          </AppText>
          {draft.active && <Progress value={draft.captured.length / draft.shots.length} onHero />}
          <View style={styles.heroActions}>
            <Button label="اقترح فكرة" icon="sparkle" variant="hero" height={44} style={ui.flex} onPress={() => router.push('/assistant')} />
            <Button
              label={draft.active ? 'تابع التصوير' : 'صوّر الآن'}
              icon="camera"
              height={44}
              style={ui.flex}
              colors={{ bg: 'rgba(255,255,255,0.1)', fg: c.heroText }}
              onPress={() => {
                if (!draft.active) startDraft(creator ? 'فيديو جديد' : 'ريل جديد', starterShots[creator ? 'creator' : 'shop']);
                router.push('/(tabs)/camera');
              }}
            />
          </View>
        </Card>
      </Appear>

      <Appear order={2}>
        <Card>
          <View style={ui.between}>
            <AppText weight="semibold" size={15}>
              خطوات البداية
            </AppText>
            <AppText size={12.5} color={c.muted} style={ui.tabular}>
              {doneCount} من {steps.length}
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
      </Appear>

      <SectionTitle title={creator ? 'المتابعون والتفاعل' : 'الطلبات والرسائل'} />
      <Card style={styles.empty}>
        <View style={[styles.emptyIcon, { backgroundColor: c.tile }]}>
          <Icon name="chart" color={c.muted} size={20} />
        </View>
        <AppText weight="medium" size={14.5} center>
          لا توجد أرقام بعد
        </AppText>
        <AppText size={12.5} color={c.muted} center lineHeight={19}>
          {creator
            ? 'بعد نشر أول فيديو وربط حساباتك تظهر هنا المشاهدات والمتابعون الجدد والتفاعل.'
            : 'بعد نشر أول ريل وربط حساباتك تظهر هنا الطلبات ونسبة الرد وكلفة كل طلب.'}
        </AppText>
        <Button label="جرّب المساعد مع زبون" variant="secondary" height={42} icon="chat" onPress={() => router.push('/test-chat')} />
      </Card>

      {orders.length > 0 && (
        <>
          <SectionTitle title="طلباتك" />
          <Card style={styles.list}>
            {orders.slice(0, 5).map((o, i, arr) => (
              <ListRow
                key={o.id}
                icon="video"
                title={o.title}
                subtitle={`${tiers[o.tier].name} · قيد التنفيذ`}
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
});
