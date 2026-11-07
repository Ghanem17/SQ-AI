import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatIQD, formatNumber, lastMonths, radius } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { HeroSurface } from '@/components/brand';
import { Button } from '@/components/Button';
import { Legend, LineChart, MiniBars } from '@/components/charts';
import { Card, IconButton, KeyValue, Note, PageTitle, ScrollScreen, SectionTitle, Segmented, StatCard } from '@/components/ui';
import { useServices } from '@/features/services/store';
import { useI18n, type Lang } from '@/i18n';
import { useSession } from '@/state/session';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

type Period = '30d' | '6m' | 'year';

// Read outside render so the screen stays pure.
const now = () => Date.now();
const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
};

function axis(period: Period, lang: Lang): string[] {
  if (period === '30d') return [1, 2, 3, 4].map((w) => (lang === 'ar' ? `أسبوع ${w}` : `Week ${w}`));
  if (period === '6m') return lastMonths(now(), 6, lang);
  // Every other month, so twelve labels still fit.
  return lastMonths(now(), 12, lang).map((m, i) => (i % 2 === 1 ? m : ''));
}

// Reports keep the full layout of the populated screen, with "—" wherever a
// number needs linked ad accounts. Only the app's own spending, which this
// device recorded, shows real figures.
export default function ReportTab() {
  const { c } = useTheme();
  const { L, lang } = useI18n();
  const { accountType } = useSession();
  const { orders, spentThisMonth } = useStudio();
  const { jobs } = useServices();
  const [period, setPeriod] = useState<Period>('6m');
  const creator = accountType === 'creator';

  const reels = orders.reduce((s, o) => s + o.reelPrice, 0);
  const promo = orders.reduce((s, o) => s + o.promoCost, 0);
  const servicesTotal = jobs.reduce((s, j) => s + j.quote.totalIqd, 0);
  const monthStart = startOfMonth();
  const servicesThisMonth = jobs.filter((j) => j.createdAt >= monthStart).reduce((s, j) => s + j.quote.totalIqd, 0);
  const labels = axis(period, lang);

  return (
    <ScrollScreen inTabs>
      <PageTitle
        title={creator ? L('النمو', 'Growth') : L('التقارير', 'Reports')}
        subtitle={creator ? L('المتابعون والتفاعل والدخل', 'Followers, engagement and income') : L('تكلفة كل طلب ومن أين جاء', 'What each order cost and where it came from')}
        right={<IconButton icon="download" label={L('تنزيل التقرير، متاح بعد ظهور البيانات', 'Download report, available once there is data')} disabled onPress={() => undefined} />}
      />
      <Segmented<Period>
        options={[
          { value: '30d', label: L('30 يومًا', '30 days') },
          { value: '6m', label: L('6 أشهر', '6 months') },
          { value: 'year', label: L('سنة', 'Year') },
        ]}
        value={period}
        onChange={setPeriod}
      />

      <HeroSurface style={styles.hero} arcs={{ endInset: 20, cy: 110 }}>
        <View style={styles.heroRow}>
          <View style={styles.flex}>
            <AppText variant="small" color={c.heroMuted}>
              {creator ? L('المتابعون الجدد', 'New followers') : L('الطلبات من الإعلانات', 'Orders from ads')}
            </AppText>
            <AppText variant="displaySm" color={c.heroMuted} accessibilityLabel={L('لا توجد بيانات', 'No data')}>
              —
            </AppText>
            <AppText size={11} lineHeight={16} color={c.heroMuted}>
              {L('لا توجد بيانات لهذه الفترة', 'No data for this period')}
            </AppText>
          </View>
          <MiniBars values={[1, 1, 1, 1, 1, 1]} empty height={56} />
        </View>
      </HeroSurface>

      <View style={styles.grid}>
        <View style={styles.gridRow}>
          <StatCard icon="wallet" tone="acc" label={L('تكلفة الطلب', 'Cost per order')} value={null} />
          <StatCard icon="chat" label={L('نسبة الرد', 'Reply rate')} value={null} />
        </View>
        <View style={styles.gridRow}>
          <StatCard icon="users" tone="ok" label={L('متابعون جدد', 'New followers')} value={null} />
          <StatCard icon="video" label={L('ريلز منشورة', 'Reels published')} value={null} />
        </View>
      </View>

      <Card style={styles.chartCard}>
        <View style={styles.chartHead}>
          <AppText variant="h3" style={styles.flex}>
            {L('الطلبات مقابل الإنفاق', 'Orders vs. spend')}
          </AppText>
          <Legend items={[{ label: L('الطلبات', 'Orders') }, { label: L('الإنفاق', 'Spend'), second: true }]} />
        </View>
        <LineChart
          labels={labels}
          height={124}
          padTop={14}
          summary={L('لا توجد بيانات بعد', 'No data yet')}
          overlay={
            <View style={styles.overlay}>
              <AppText variant="small" color={c.muted} center style={[styles.overlayText, { backgroundColor: c.card }]}>
                {L('تبدأ التقارير بعد ربط حساب إعلاني ونشر أول إعلان.', 'Reports start once an ad account is linked and your first ad runs.')}
              </AppText>
              <Button small icon="link" label={L('اربط حساباتك', 'Link your accounts')} onPress={() => router.push('/account')} />
            </View>
          }
        />
      </Card>

      <SectionTitle title={L('مصاريفك في التطبيق', 'Your spending in the app')} />
      <Card style={styles.kvCard}>
        <KeyValue icon="layers" label={L(`طلبات الخدمات (${formatNumber(jobs.length)})`, `Service orders (${formatNumber(jobs.length)})`)} value={formatIQD(servicesTotal)} />
        <KeyValue icon="video" divider label={L(`الريلز المطلوبة (${formatNumber(orders.length)})`, `Reels ordered (${formatNumber(orders.length)})`)} value={formatIQD(reels)} />
        <KeyValue icon="ads" divider label={L('ميزانيات الترويج', 'Promotion budgets')} value={formatIQD(promo)} />
        <KeyValue icon="receipt" divider strong label={L('هذا الشهر', 'This month')} value={formatIQD(spentThisMonth + servicesThisMonth)} />
      </Card>
      <Note>
        {L(
          'الأرقام هنا من طلباتك على هذا الجهاز فقط. بعد تشغيل الخادم تُحفظ في حسابك وتظهر على جميع أجهزتك.',
          'These numbers come from orders on this device only. Once the server runs, they are kept in your account on all devices.',
        )}
      </Note>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { borderRadius: radius.card, padding: 16 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  grid: { gap: 10 },
  gridRow: { flexDirection: 'row', gap: 10 },
  chartCard: { paddingTop: 14, paddingBottom: 8, gap: 6 },
  chartHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  overlay: { alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  overlayText: { paddingHorizontal: 8 },
  kvCard: { paddingVertical: 6, gap: 0 },
});
