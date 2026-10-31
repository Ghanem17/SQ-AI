import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatIQD, formatNumber, platformNames } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Appear, Badge, Card, Divider, IconButton, Note, PageTitle, PlatformTag, Progress, ScrollScreen, SectionTitle, Stat, ToggleRow, ui } from '@/components/ui';
import { campaigns, ideas, type Campaign } from '@/mock/data';
import { useSession } from '@/state/session';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

export default function AdsTab() {
  const { accountType } = useSession();
  return accountType === 'creator' ? <Ideas /> : <Ads />;
}

const statusLabel: Record<Campaign['status'], string> = { active: 'يعمل', paused: 'متوقف', ended: 'انتهى' };

function Ads() {
  const { c } = useTheme();
  const { automation, setAutomation, spentThisMonth } = useStudio();
  const [paused, setPaused] = useState<Record<string, boolean>>({});
  const totalOrders = campaigns.reduce((s, x) => s + x.orders, 0);
  const totalSpent = campaigns.reduce((s, x) => s + x.spent, 0);
  const totalReach = campaigns.reduce((s, x) => s + x.reach, 0);

  return (
    <ScrollScreen inTabs>
      <PageTitle title="الإعلانات" subtitle="ترويج الريلز ضمن سقف تحدده أنت" right={<IconButton icon="plus" label="روّج ريل" onPress={() => router.push('/reel/promote')} />} />

      <Card tone="hero">
        <View style={ui.between}>
          <AppText size={12.5} color={c.heroMuted}>
            الصرف هذا الشهر
          </AppText>
          <PressableScale accessibilityRole="button" onPress={() => router.push('/automation')} style={styles.capLink}>
            <AppText size={12.5} weight="medium" color={c.heroText}>
              تعديل السقف
            </AppText>
          </PressableScale>
        </View>
        <View style={styles.budget}>
          <AppText weight="semibold" size={26} lineHeight={34} color={c.heroText} style={ui.tabular}>
            {formatNumber(spentThisMonth)}
          </AppText>
          <AppText size={13} color={c.heroMuted} style={ui.tabular}>
            من {formatIQD(automation.monthlyCap)}
          </AppText>
        </View>
        <Progress value={spentThisMonth / automation.monthlyCap} onHero />
        <AppText size={12} color={c.heroMuted}>
          يتوقف كل ترويج تلقائيًا عند الوصول للسقف.
        </AppText>
      </Card>

      <Card>
        <View style={styles.stats}>
          <Stat label="الوصول" value={formatNumber(totalReach)} />
          <Stat label="الطلبات" value={formatNumber(totalOrders)} />
          <Stat label="كلفة الطلب" value={formatNumber(Math.round(totalSpent / totalOrders / 10) * 10)} unit="د.ع" />
        </View>
      </Card>

      <Card style={styles.toggleCard}>
        <ToggleRow
          title="روّج الريل الأنجح تلقائيًا"
          subtitle="إذا جاب ريل طلبات بكلفة أقل من المعدل، نزيد ميزانيته ضمن السقف"
          value={automation.autoPromote}
          onChange={(autoPromote) => setAutomation({ autoPromote })}
          last
        />
      </Card>

      <SectionTitle title="الحملات" />
      {campaigns.map((x, i) => {
        const status = x.status === 'active' && paused[x.id] ? 'paused' : x.status === 'paused' && paused[x.id] === false ? 'active' : x.status;
        const cpo = x.orders ? Math.round(x.spent / x.orders / 10) * 10 : 0;
        return (
          <Appear key={x.id} order={i}>
            <Card>
              <View style={styles.campHead}>
                <PlatformTag platform={x.platform} size={26} />
                <View style={ui.flex}>
                  <AppText weight="semibold" size={14.5}>
                    {x.title}
                  </AppText>
                  <AppText size={12} color={c.muted}>
                    {platformNames[x.platform]} · {formatIQD(x.daily)} يوميًا{status === 'active' ? ` · باقي ${x.daysLeft} أيام` : ''}
                  </AppText>
                </View>
                <Badge label={statusLabel[status]} tone={status === 'active' ? 'ok' : status === 'paused' ? 'acc' : 'neutral'} />
              </View>
              <Divider />
              <View style={styles.stats}>
                <Stat label="الصرف" value={formatNumber(x.spent)} />
                <Stat label="الطلبات" value={String(x.orders)} />
                <Stat label="للطلب" value={formatNumber(cpo)} />
              </View>
              {status !== 'ended' && (
                <Button
                  label={status === 'active' ? 'أوقف مؤقتًا' : 'استأنف'}
                  variant="secondary"
                  height={38}
                  icon={status === 'active' ? 'minus' : 'play'}
                  onPress={() => setPaused((p) => ({ ...p, [x.id]: status === 'active' }))}
                />
              )}
            </Card>
          </Appear>
        );
      })}

      <Note>الأرقام من حساب إعلانات تجريبي. بعد ربط حساب Meta وTikTok تظهر هنا أرقامك الفعلية.</Note>
    </ScrollScreen>
  );
}

function Ideas() {
  const { c } = useTheme();
  const { startDraft } = useStudio();
  return (
    <ScrollScreen inTabs>
      <PageTitle title="الأفكار" subtitle="مبنية على أداء محتواك وما يبحث عنه جمهورك" />
      <Card onPress={() => router.push('/assistant')} accessibilityLabel="اسأل المساعد" style={styles.ask}>
        <View style={[styles.askIcon, { backgroundColor: c.priSoft }]}>
          <Icon name="sparkle" color={c.onPriSoft} size={18} />
        </View>
        <View style={ui.flex}>
          <AppText weight="medium" size={14.5}>
            اسأل المساعد عن فكرة
          </AppText>
          <AppText size={12.5} color={c.muted}>
            «شو أصوّر هالأسبوع؟» ويعطيك أفكارًا وقائمة لقطات
          </AppText>
        </View>
        <Icon name="chevronLeft" color={c.placeholder} size={18} />
      </Card>

      {ideas.map((idea, i) => (
        <Appear key={idea.id} order={i}>
          <Card>
            <AppText weight="semibold" size={15.5}>
              {idea.title}
            </AppText>
            <AppText size={13} color={c.text}>
              {idea.hook}
            </AppText>
            <View style={styles.why}>
              <Icon name="trend" color={c.ok} size={14} />
              <AppText size={12.5} color={c.muted} style={ui.flex}>
                {idea.why}
              </AppText>
            </View>
            <View style={styles.ideaActions}>
              <Badge label={`${idea.shots} لقطات`} icon="camera" />
              <View style={ui.flex} />
              <Button
                label="صوّرها"
                icon="camera"
                height={38}
                onPress={() => {
                  startDraft(idea.title);
                  router.push('/(tabs)/camera');
                }}
              />
            </View>
          </Card>
        </Appear>
      ))}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  capLink: { minHeight: 32, justifyContent: 'center' },
  budget: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  stats: { flexDirection: 'row', gap: 12 },
  toggleCard: { paddingVertical: 4 },
  campHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ask: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  askIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  why: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ideaActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
});
