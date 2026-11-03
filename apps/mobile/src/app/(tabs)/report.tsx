import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatIQD } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Card, KeyValue, Note, PageTitle, ScrollScreen, SectionTitle } from '@/components/ui';
import { useSession } from '@/state/session';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

// Report for a real account: only what this device actually recorded, and
// a clear note on what appears once accounts are connected.
export default function ReportTab() {
  const { c } = useTheme();
  const { accountType } = useSession();
  const { orders, spentThisMonth } = useStudio();
  const creator = accountType === 'creator';
  const reels = orders.reduce((s, o) => s + o.reelPrice, 0);
  const promo = orders.reduce((s, o) => s + o.promoCost, 0);

  return (
    <ScrollScreen inTabs>
      <PageTitle title={creator ? 'النمو' : 'التقرير'} subtitle={creator ? 'متابعون وتفاعل ودخل' : 'كم كلّفك كل طلب، ومن أين جاء'} />

      <Card style={styles.empty}>
        <View style={[styles.emptyIcon, { backgroundColor: c.tile }]}>
          <Icon name={creator ? 'trend' : 'chart'} color={c.muted} size={22} />
        </View>
        <AppText weight="semibold" size={15} center>
          التقرير يبدأ بعد أول نشر
        </AppText>
        <AppText size={13} color={c.muted} center lineHeight={20}>
          {creator
            ? 'بعد ربط حساباتك ونشر أول فيديو نعرض المتابعين الجدد والمشاهدات والتفاعل وأفضل منشوراتك.'
            : 'بعد ربط حساباتك ونشر أول ريل نربط كل طلب بالمحادثة والإعلان الذي جاء منه، ونعرض كلفة كل طلب وأفضل الريلز.'}
        </AppText>
        <Button label="صوّر أول ريل" variant="secondary" height={42} icon="camera" onPress={() => router.push('/(tabs)/camera')} style={styles.btn} />
      </Card>

      <SectionTitle title="مصاريفك في التطبيق" />
      <Card>
        <KeyValue label="الريلز المطلوبة" value={String(orders.length)} />
        <KeyValue label="كلفة الريلز" value={formatIQD(reels)} />
        <KeyValue label="ميزانيات الترويج" value={formatIQD(promo)} />
        <KeyValue label="هذا الشهر" value={formatIQD(spentThisMonth)} strong />
      </Card>

      <Note>الأرقام هنا من طلباتك على هذا الجهاز فقط. بعد تشغيل السيرفر تُحفظ على حسابك وتظهر على كل أجهزتك.</Note>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: 26, gap: 8 },
  emptyIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  btn: { alignSelf: 'stretch', marginTop: 4 },
});
