import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatIQD, formatNumber } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { BarList, LineChart } from '@/components/charts';
import { Card, Divider, ListRow, Note, PageTitle, ScrollScreen, SectionTitle, Segmented, Stat, ui } from '@/components/ui';
import { growth, report } from '@/mock/data';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/theme';

type Period = '7' | '30' | '90';

const change = (now: number, prev: number) => Math.round(((now - prev) / prev) * 100);
const pct = (n: number) => `${n > 0 ? '↑' : '↓'} ${Math.abs(n)}%`;

export default function ReportTab() {
  const { accountType } = useSession();
  return accountType === 'creator' ? <Growth /> : <Report />;
}

function Report() {
  const { c } = useTheme();
  const [period, setPeriod] = useState<Period>('30');
  const cpo = change(report.costPerOrder.value, report.costPerOrder.prev);

  return (
    <ScrollScreen inTabs>
      <PageTitle title="التقرير" subtitle="كم كلّفك كل طلب، ومن أين جاء" />
      <Segmented
        options={[
          { value: '7', label: '7 أيام' },
          { value: '30', label: '30 يومًا' },
          { value: '90', label: '3 أشهر' },
        ]}
        value={period}
        onChange={setPeriod}
      />

      <Card>
        <View style={ui.between}>
          <View>
            <AppText size={12.5} color={c.muted}>
              كلفة الطلب الواحد
            </AppText>
            <View style={styles.big}>
              <AppText weight="semibold" size={28} lineHeight={36} style={ui.tabular}>
                {formatNumber(report.costPerOrder.value)}
              </AppText>
              <AppText size={13} color={c.muted}>
                د.ع
              </AppText>
            </View>
          </View>
          <AppText size={13} weight="medium" color={cpo < 0 ? c.ok : c.bad}>
            {pct(cpo)} عن الفترة السابقة
          </AppText>
        </View>
        <LineChart values={report.costPerOrder.series} labels={['قبل 8 أسابيع', 'قبل 4', 'الآن']} />
      </Card>

      <Card>
        <View style={styles.stats}>
          <Stat label="الطلبات" value={formatNumber(report.orders.value)} delta={pct(change(report.orders.value, report.orders.prev))} good />
          <Stat label="الإيراد" value={formatNumber(report.revenue.value / 1000)} unit="ألف" delta={pct(change(report.revenue.value, report.revenue.prev))} good />
        </View>
        <Divider />
        <View style={styles.stats}>
          <Stat label="صرف الإعلانات" value={formatNumber(report.spend.value / 1000)} unit="ألف" delta={pct(change(report.spend.value, report.spend.prev))} good={report.spend.value < report.spend.prev} />
          <Stat label="العائد على الإعلان" value={(report.revenue.value / report.spend.value).toFixed(1)} unit="ضعف" delta="لكل دينار إعلان" good />
        </View>
      </Card>

      <SectionTitle title="الطلبات حسب المصدر" />
      <Card>
        <BarList items={report.sources} />
      </Card>

      <SectionTitle title="أفضل الريلز" />
      <Card style={styles.list}>
        {report.topReels.map((r, i) => (
          <ListRow
            key={r.title}
            leading={
              <View style={[styles.rank, { backgroundColor: i === 0 ? c.primary : c.tile }]}>
                <AppText weight="semibold" size={13} color={i === 0 ? c.onPrimary : c.muted}>
                  {i + 1}
                </AppText>
              </View>
            }
            title={r.title}
            subtitle={`${r.orders} طلبًا · ${r.views} مشاهدة`}
            trailing={formatIQD(r.cost)}
            last={i === report.topReels.length - 1}
          />
        ))}
      </Card>

      <Note icon="info">نربط كل طلب بالمحادثة التي جاء منها وبالإعلان أو الريل الذي أوصله، لذلك الأرقام هنا لكل طلب فعلي وليست تقديرًا.</Note>
    </ScrollScreen>
  );
}

function Growth() {
  const { c } = useTheme();
  const [period, setPeriod] = useState<Period>('30');
  return (
    <ScrollScreen inTabs>
      <PageTitle title="النمو" subtitle="متابعون، تفاعل، ودخل" />
      <Segmented
        options={[
          { value: '7', label: '7 أيام' },
          { value: '30', label: '30 يومًا' },
          { value: '90', label: '3 أشهر' },
        ]}
        value={period}
        onChange={setPeriod}
      />
      <Card>
        <View style={ui.between}>
          <View>
            <AppText size={12.5} color={c.muted}>
              المتابعون
            </AppText>
            <AppText weight="semibold" size={28} lineHeight={36} style={ui.tabular}>
              {formatNumber(growth.followers.value)}
            </AppText>
          </View>
          <AppText size={13} weight="medium" color={c.ok}>
            {pct(change(growth.followers.value, growth.followers.prev))}
          </AppText>
        </View>
        <LineChart values={growth.followers.series} labels={['قبل 8 أسابيع', 'قبل 4', 'الآن']} />
      </Card>
      <Card>
        <View style={styles.stats}>
          <Stat label="التفاعل" value={`${growth.engagement.value}%`} delta={`↑ ${(growth.engagement.value - growth.engagement.prev).toFixed(1)} نقطة`} good />
          <Stat label="المشاهدات" value={formatNumber(growth.views.value / 1000)} unit="ألف" delta={pct(change(growth.views.value, growth.views.prev))} good />
          <Stat label="الدخل" value={formatNumber(growth.income.value / 1000)} unit="ألف" delta={pct(change(growth.income.value, growth.income.prev))} good />
        </View>
      </Card>
      <SectionTitle title="حسب المنصة" />
      <Card>
        <BarList items={growth.platforms} />
      </Card>
      <SectionTitle title="أفضل المنشورات" />
      <Card style={styles.list}>
        {growth.topPosts.map((p, i) => (
          <ListRow key={p.title} icon="video" title={p.title} subtitle={`${p.views} مشاهدة`} trailing={`\u2066+${formatNumber(p.followers)}\u2069`} last={i === growth.topPosts.length - 1} />
        ))}
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  big: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  stats: { flexDirection: 'row', gap: 12 },
  list: { paddingVertical: 2, gap: 0 },
  rank: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
