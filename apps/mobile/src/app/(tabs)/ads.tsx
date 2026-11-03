import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatIQD, formatNumber } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Card, Note, PageTitle, Progress, ScrollScreen, SectionTitle, ToggleRow, ui } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useSession } from '@/state/session';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

export default function AdsTab() {
  const { accountType } = useSession();
  return accountType === 'creator' ? <Ideas /> : <Ads />;
}

function Empty({ icon, title, body, action, onAction }: { icon: IconName; title: string; body: string; action?: string; onAction?: () => void }) {
  const { c } = useTheme();
  return (
    <Card style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: c.tile }]}>
        <Icon name={icon} color={c.muted} size={22} />
      </View>
      <AppText weight="semibold" size={15} center>
        {title}
      </AppText>
      <AppText size={13} color={c.muted} center lineHeight={20}>
        {body}
      </AppText>
      {action && onAction && <Button label={action} variant="secondary" height={42} onPress={onAction} style={styles.emptyBtn} />}
    </Card>
  );
}

function Ads() {
  const { c } = useTheme();
  const { L } = useI18n();
  const { automation, setAutomation, spentThisMonth, orders } = useStudio();
  const promoted = orders.filter((o) => o.promo !== 'none');

  return (
    <ScrollScreen inTabs>
      <PageTitle title={L('الإعلانات', 'Ads')} subtitle={L('ترويج الريلز ضمن سقف تحدده أنت', 'Promote reels within a cap you set')} />

      <Card tone="hero">
        <View style={ui.between}>
          <AppText size={12.5} color={c.heroMuted}>
            {L('الإنفاق هذا الشهر', 'Spent this month')}
          </AppText>
          <PressableScale accessibilityRole="button" onPress={() => router.push('/automation')} style={styles.capLink}>
            <AppText size={12.5} weight="medium" color={c.heroText}>
              {L('تعديل السقف', 'Change cap')}
            </AppText>
          </PressableScale>
        </View>
        <View style={styles.budget}>
          <AppText weight="semibold" size={26} lineHeight={34} color={c.heroText} style={ui.tabular}>
            {formatNumber(spentThisMonth)}
          </AppText>
          <AppText size={13} color={c.heroMuted} style={ui.tabular}>
            {L(`من ${formatIQD(automation.monthlyCap)}`, `of ${formatIQD(automation.monthlyCap)}`)}
          </AppText>
        </View>
        <Progress value={spentThisMonth / automation.monthlyCap} onHero />
        <AppText size={12} color={c.heroMuted}>
          {L('يتوقف كل ترويج تلقائيًا عند بلوغ السقف.', 'All promotion stops automatically at the cap.')}
        </AppText>
      </Card>

      <Card style={styles.toggleCard}>
        <ToggleRow
          title={L('روّج الريل الأنجح تلقائيًا', 'Auto-promote the best reel')}
          subtitle={L('إذا جلب ريلٌ طلبات بتكلفة أقل من المعدل، نزيد ميزانيته ضمن السقف', 'If a reel brings orders below the average cost, we raise its budget within the cap')}
          value={automation.autoPromote}
          onChange={(autoPromote) => setAutomation({ autoPromote })}
          last
        />
      </Card>

      <SectionTitle title={L('الحملات', 'Campaigns')} />
      {promoted.length === 0 ? (
        <Empty
          icon="ads"
          title={L('لا توجد حملات بعد', 'No campaigns yet')}
          body={L(
            'بعد تصوير ريل تختار مستوى الترويج وعدد الأيام، ويظهر هنا الإنفاق والوصول وتكلفة كل طلب.',
            'After filming a reel you pick a promotion level and days; spend, reach and cost per order show here.',
          )}
          action={L('صوّر ريلًا', 'Film a reel')}
          onAction={() => router.push('/(tabs)/camera')}
        />
      ) : (
        promoted.map((o) => (
          <Card key={o.id}>
            <View style={ui.between}>
              <AppText weight="semibold" size={14.5}>
                {o.title}
              </AppText>
              <AppText size={13} style={ui.tabular}>
                {formatIQD(o.promoCost)}
              </AppText>
            </View>
            <AppText size={12.5} color={c.muted}>
              {L(`${o.promoDays} أيام · يبدأ بعد النشر`, `${o.promoDays} days · starts after posting`)}
            </AppText>
          </Card>
        ))
      )}

      <Note>{L('تظهر نتائج الحملات بعد ربط حسابَي إعلانات Meta وTikTok عند تشغيل الخادم.', 'Campaign results appear once Meta and TikTok ad accounts are linked on the server.')}</Note>
    </ScrollScreen>
  );
}

function Ideas() {
  const { c } = useTheme();
  const { L } = useI18n();
  return (
    <ScrollScreen inTabs>
      <PageTitle title={L('الأفكار', 'Ideas')} subtitle={L('مبنية على مجالك وما يبحث عنه جمهورك', 'Built on your niche and what your audience looks for')} />
      <Card onPress={() => router.push('/assistant')} accessibilityLabel={L('اطلب أفكارًا من المساعد', 'Ask the assistant for ideas')} style={styles.ask}>
        <View style={[styles.askIcon, { backgroundColor: c.priSoft }]}>
          <Icon name="sparkle" color={c.onPriSoft} size={18} />
        </View>
        <View style={ui.flex}>
          <AppText weight="medium" size={14.5}>
            {L('اطلب أفكارًا من المساعد', 'Ask the assistant for ideas')}
          </AppText>
          <AppText size={12.5} color={c.muted}>
            {L('«ماذا أصوّر هذا الأسبوع؟» فيعطيك أفكارًا وقائمة لقطات', '"What should I film this week?" gets you ideas and a shot list')}
          </AppText>
        </View>
        <Icon name="chevronLeft" color={c.placeholder} size={18} />
      </Card>
      <Empty
        icon="bulb"
        title={L('لا توجد أفكار محفوظة', 'No saved ideas')}
        body={L(
          'تبدأ التصوير مباشرة من الأفكار التي يقترحها المساعد. بعد ربط حساباتك نقترح أفكارًا من أداء فيديوهاتك أيضًا.',
          'Start filming straight from the assistant’s ideas. Once accounts are linked, we also suggest ideas from how your videos perform.',
        )}
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  capLink: { minHeight: 32, justifyContent: 'center' },
  budget: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  toggleCard: { paddingVertical: 4 },
  empty: { alignItems: 'center', paddingVertical: 26, gap: 8 },
  emptyIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  emptyBtn: { alignSelf: 'stretch', marginTop: 4 },
  ask: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  askIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
