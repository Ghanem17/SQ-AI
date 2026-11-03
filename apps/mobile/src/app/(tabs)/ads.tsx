import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatIQD, formatNumber } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Card, Note, PageTitle, Progress, ScrollScreen, SectionTitle, ToggleRow, ui } from '@/components/ui';
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
  const { automation, setAutomation, spentThisMonth, orders } = useStudio();
  const promoted = orders.filter((o) => o.promo !== 'none');

  return (
    <ScrollScreen inTabs>
      <PageTitle title="الإعلانات" subtitle="ترويج الريلز ضمن سقف تحدده أنت" />

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
      {promoted.length === 0 ? (
        <Empty
          icon="ads"
          title="لا توجد حملات بعد"
          body="بعد تصوير ريل تختار مستوى الترويج وعدد الأيام، ويظهر هنا الصرف والوصول وكلفة كل طلب."
          action="صوّر ريل"
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
              {o.promoDays} أيام · يبدأ بعد النشر
            </AppText>
          </Card>
        ))
      )}

      <Note>نتائج الحملات تظهر بعد ربط حساب إعلانات Meta وTikTok عند تشغيل السيرفر.</Note>
    </ScrollScreen>
  );
}

function Ideas() {
  const { c } = useTheme();
  return (
    <ScrollScreen inTabs>
      <PageTitle title="الأفكار" subtitle="مبنية على مجالك وما يبحث عنه جمهورك" />
      <Card onPress={() => router.push('/assistant')} accessibilityLabel="اطلب أفكارًا من المساعد" style={styles.ask}>
        <View style={[styles.askIcon, { backgroundColor: c.priSoft }]}>
          <Icon name="sparkle" color={c.onPriSoft} size={18} />
        </View>
        <View style={ui.flex}>
          <AppText weight="medium" size={14.5}>
            اطلب أفكارًا من المساعد
          </AppText>
          <AppText size={12.5} color={c.muted}>
            «شو أصوّر هالأسبوع؟» ويعطيك أفكارًا وقائمة لقطات
          </AppText>
        </View>
        <Icon name="chevronLeft" color={c.placeholder} size={18} />
      </Card>
      <Empty
        icon="bulb"
        title="لا توجد أفكار محفوظة"
        body="الأفكار التي يقترحها المساعد تبدأ منها التصوير مباشرة. بعد ربط حساباتك نقترح أفكارًا من أداء فيديوهاتك أيضًا."
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
