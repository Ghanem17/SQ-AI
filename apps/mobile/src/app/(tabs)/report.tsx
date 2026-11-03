import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatIQD } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Card, KeyValue, Note, PageTitle, ScrollScreen, SectionTitle } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useSession } from '@/state/session';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

// Report for a real account: only what this device actually recorded, and
// a clear note on what appears once accounts are connected.
export default function ReportTab() {
  const { c } = useTheme();
  const { L } = useI18n();
  const { accountType } = useSession();
  const { orders, spentThisMonth } = useStudio();
  const creator = accountType === 'creator';
  const reels = orders.reduce((s, o) => s + o.reelPrice, 0);
  const promo = orders.reduce((s, o) => s + o.promoCost, 0);

  return (
    <ScrollScreen inTabs>
      <PageTitle
        title={creator ? L('النمو', 'Growth') : L('التقرير', 'Report')}
        subtitle={creator ? L('المتابعون والتفاعل والدخل', 'Followers, engagement and income') : L('تكلفة كل طلب ومصدره', 'What each order cost and where it came from')}
      />

      <Card style={styles.empty}>
        <View style={[styles.emptyIcon, { backgroundColor: c.tile }]}>
          <Icon name={creator ? 'trend' : 'chart'} color={c.muted} size={22} />
        </View>
        <AppText weight="semibold" size={15} center>
          {L('يبدأ التقرير بعد أول نشر', 'The report starts after your first post')}
        </AppText>
        <AppText size={13} color={c.muted} center lineHeight={20}>
          {creator
            ? L('بعد ربط حساباتك ونشر أول فيديو، نعرض المتابعين الجدد والمشاهدات والتفاعل وأفضل منشوراتك.', 'After linking accounts and your first video, we show new followers, views, engagement and your best posts.')
            : L(
                'بعد ربط حساباتك ونشر أول ريل، نربط كل طلب بالمحادثة والإعلان الذي جاء منه، ونعرض تكلفة كل طلب وأفضل الريلز.',
                'After linking accounts and your first reel, we tie each order to its chat and ad, and show cost per order and your best reels.',
              )}
        </AppText>
        <Button label={L('صوّر أول ريل', 'Film your first reel')} variant="secondary" height={42} icon="camera" onPress={() => router.push('/(tabs)/camera')} style={styles.btn} />
      </Card>

      <SectionTitle title={L('مصاريفك في التطبيق', 'Your spending in the app')} />
      <Card>
        <KeyValue label={L('الريلز المطلوبة', 'Reels ordered')} value={String(orders.length)} />
        <KeyValue label={L('تكلفة الريلز', 'Reels cost')} value={formatIQD(reels)} />
        <KeyValue label={L('ميزانيات الترويج', 'Promotion budgets')} value={formatIQD(promo)} />
        <KeyValue label={L('هذا الشهر', 'This month')} value={formatIQD(spentThisMonth)} strong />
      </Card>

      <Note>{L('الأرقام هنا من طلباتك على هذا الجهاز فقط. بعد تشغيل الخادم تُحفظ في حسابك وتظهر على جميع أجهزتك.', 'These numbers come from orders on this device only. Once the server runs, they are kept in your account on all devices.')}</Note>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: 26, gap: 8 },
  emptyIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  btn: { alignSelf: 'stretch', marginTop: 4 },
});
