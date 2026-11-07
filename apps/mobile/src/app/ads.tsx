import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatIQD, formatNumber, radius } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { HeroSurface } from '@/components/brand';
import { PressableScale } from '@/components/PressableScale';
import { EmptyState, ListCard, ListRow, Note, Progress, ScrollScreen, SectionTitle, ToggleRow, TopBar } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useSession } from '@/state/session';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

// Promotion within a cap the owner sets. Creators see their ideas here.
export default function AdsScreen() {
  const { accountType } = useSession();
  return accountType === 'creator' ? <Ideas /> : <Ads />;
}

function Ads() {
  const { c } = useTheme();
  const { L } = useI18n();
  const { automation, setAutomation, spentThisMonth, orders } = useStudio();
  const promoted = orders.filter((o) => o.promo !== 'none');

  return (
    <ScrollScreen header={<TopBar title={L('الإعلانات', 'Ads')} subtitle={L('ترويج الريلز ضمن سقف تحدده أنت', 'Promote reels within a cap you set')} />}>
      <HeroSurface style={styles.hero} arcs={{ endInset: 20, cy: 110 }}>
        <View style={styles.heroHead}>
          <AppText variant="small" color={c.heroMuted}>
            {L('الإنفاق هذا الشهر', 'Spent this month')}
          </AppText>
          <PressableScale accessibilityRole="button" onPress={() => router.push('/automation')} style={[styles.pill, { backgroundColor: c.heroTile, borderColor: c.heroTileLine }]}>
            <AppText weight="medium" size={11.5} lineHeight={16} color={c.heroText}>
              {L('تعديل السقف', 'Change cap')}
            </AppText>
          </PressableScale>
        </View>
        <View style={styles.budget}>
          <AppText variant="displaySm" color={c.heroText}>
            {formatNumber(spentThisMonth)}
          </AppText>
          <AppText variant="small" color={c.heroMuted}>
            {L(`من ${formatIQD(automation.monthlyCap)}`, `of ${formatIQD(automation.monthlyCap)}`)}
          </AppText>
        </View>
        <Progress value={spentThisMonth / automation.monthlyCap} onHero />
        <AppText size={11.5} lineHeight={16} color={c.heroMuted}>
          {L('يتوقف كل ترويج تلقائيًا عند بلوغ السقف.', 'All promotion stops automatically at the cap.')}
        </AppText>
      </HeroSurface>

      <ListCard>
        <ToggleRow
          icon="trend"
          title={L('روّج الريل الأنجح تلقائيًا', 'Auto-promote the best reel')}
          subtitle={L('إذا جلب ريلٌ طلبات بتكلفة أقل من المعدل، نزيد ميزانيته ضمن السقف', 'If a reel brings orders below the average cost, we raise its budget within the cap')}
          value={automation.autoPromote}
          onChange={(autoPromote) => setAutomation({ autoPromote })}
          last
        />
      </ListCard>

      <SectionTitle title={L('الحملات', 'Campaigns')} />
      {promoted.length === 0 ? (
        <EmptyState
          icon="ads"
          title={L('لا توجد حملات بعد', 'No campaigns yet')}
          body={L(
            'بعد تصوير ريل تختار مستوى الترويج وعدد الأيام، ويظهر هنا الإنفاق والوصول وتكلفة كل طلب.',
            'After filming a reel you pick a promotion level and days; spend, reach and cost per order show here.',
          )}
          action={L('صوّر ريلًا', 'Film a reel')}
          actionIcon="camera"
          onAction={() => router.push('/camera')}
        />
      ) : (
        <ListCard>
          {promoted.map((o, i) => (
            <ListRow
              key={o.id}
              icon="ads"
              title={o.title}
              subtitle={L(`${o.promoDays} أيام · يبدأ بعد النشر`, `${o.promoDays} days · starts after posting`)}
              trailing={formatIQD(o.promoCost)}
              last={i === promoted.length - 1}
            />
          ))}
        </ListCard>
      )}

      <Note>{L('تظهر نتائج الحملات بعد ربط حسابَي إعلانات Meta وTikTok عند تشغيل الخادم.', 'Campaign results appear once Meta and TikTok ad accounts are linked on the server.')}</Note>
    </ScrollScreen>
  );
}

function Ideas() {
  const { L } = useI18n();
  return (
    <ScrollScreen header={<TopBar title={L('الأفكار', 'Ideas')} subtitle={L('مبنية على مجالك وما يبحث عنه جمهورك', 'Built on your niche and what your audience looks for')} />}>
      <ListCard>
        <ListRow
          icon="sparkle"
          iconTone="solid"
          title={L('اطلب أفكارًا من المساعد', 'Ask the assistant for ideas')}
          subtitle={L('«ماذا أصوّر هذا الأسبوع؟» فيعطيك أفكارًا وقائمة لقطات', '"What should I film this week?" gets you ideas and a shot list')}
          subtitleLines={2}
          onPress={() => router.push('/assistant')}
          last
        />
      </ListCard>
      <EmptyState
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
  hero: { borderRadius: radius.card, padding: 16, gap: 10 },
  heroHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { height: 28, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, justifyContent: 'center' },
  budget: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
});
