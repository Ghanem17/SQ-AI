import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatIQD, pipeline, radius, platformNames, tools, toolsFor, type Platform } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { HeroSurface } from '@/components/brand';
import { Badge, Card, Divider, ListCard, ModelChip, Note, Progress, ScrollScreen, SectionTitle, Segmented, Stepper, ToggleRow, TopBar, ui } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

const shownPlatforms: Platform[] = ['instagram', 'facebook', 'tiktok', 'whatsapp'];

// Full automation: one switch, a monthly spending cap, and the map of which
// AI or platform API handles every step, per platform.
export default function AutomationScreen() {
  const { c } = useTheme();
  const { L, pick } = useI18n();
  const { automation: a, setAutomation, spentThisMonth } = useStudio();
  const [open, setOpen] = useState<string | null>(null);
  const left = Math.max(0, a.monthlyCap - spentThisMonth);

  return (
    <ScrollScreen header={<TopBar title={L('الوضع التلقائي', 'Autopilot')} subtitle={a.enabled ? L('يعمل', 'On') : L('متوقف', 'Off')} />}>
      <HeroSurface style={styles.hero} arcs={{ endInset: 20, cy: 150 }}>
        <View style={styles.heroHead}>
          <View style={[styles.bolt, { backgroundColor: a.enabled ? c.heroOkSoft : c.heroTile, borderColor: c.heroTileLine }]}>
            <Icon name="bolt" color={a.enabled ? c.heroOk : c.heroAccent} size={18} />
          </View>
          <View style={ui.flex}>
            <AppText variant="h3" color={c.heroText}>
              {L('كل شيء تلقائي', 'Everything on autopilot')}
            </AppText>
            <AppText size={12.5} color={c.heroMuted} lineHeight={19}>
              {L(
                'فكرة، وتصوير موجّه، ومونتاج، ونشر، وترويج، ورد على العملاء، دون أي تدخل يدوي من الوكالة.',
                'Idea, guided filming, editing, posting, promotion and customer replies, with no manual agency work.',
              )}
            </AppText>
          </View>
        </View>
        <PressableScale
          accessibilityRole="switch"
          accessibilityState={{ checked: a.enabled }}
          onPress={() => setAutomation({ enabled: !a.enabled })}
          pressedScale={0.98}
          style={[styles.master, a.enabled ? { backgroundColor: c.heroTile, borderColor: c.heroTileLine, borderWidth: 1 } : { backgroundColor: c.heroBtn }]}>
          {a.enabled && <View style={[styles.liveDot, { backgroundColor: c.heroOk }]} />}
          <AppText weight="semibold" size={15} color={a.enabled ? c.heroText : c.heroBtnText}>
            {a.enabled ? L('يعمل الآن · اضغط للإيقاف', 'On now · tap to stop') : L('شغّل الوضع التلقائي', 'Turn on autopilot')}
          </AppText>
        </PressableScale>
      </HeroSurface>

      <SectionTitle title={L('سقف الإنفاق الشهري', 'Monthly spending cap')} />
      <Card>
        <View style={ui.between}>
          <View style={ui.flex}>
            <AppText variant="rowTitle">
              {L('الحد الأقصى للشهر', 'Monthly maximum')}
            </AppText>
            <AppText size={12} color={c.muted}>
              {L('الريلز والإعلانات معًا', 'Reels and ads together')}
            </AppText>
          </View>
          <Stepper value={a.monthlyCap} onChange={(monthlyCap) => setAutomation({ monthlyCap })} min={100000} max={5000000} step={100000} format={(v) => L(`${v / 1000} ألف`, `${v / 1000}k`)} />
        </View>
        <Progress value={spentThisMonth / a.monthlyCap} color={spentThisMonth > a.monthlyCap * 0.9 ? c.bad : undefined} />
        <View style={ui.between}>
          <AppText size={12.5} color={c.muted} style={ui.tabular}>
            {L(`صُرف ${formatIQD(spentThisMonth)}`, `Spent ${formatIQD(spentThisMonth)}`)}
          </AppText>
          <AppText size={12.5} color={c.muted} style={ui.tabular}>
            {L(`المتبقي ${formatIQD(left)}`, `Left ${formatIQD(left)}`)}
          </AppText>
        </View>
      </Card>

      <SectionTitle title={L('القواعد', 'Rules')} />
      <ListCard>
        <View style={styles.approval}>
          <AppText variant="rowTitle">
            {L('قبل النشر', 'Before posting')}
          </AppText>
          <Segmented
            options={[
              { value: 'ask', label: L('اسألني أولًا', 'Ask me first') },
              { value: 'auto', label: L('انشر مباشرة', 'Post directly') },
            ]}
            value={a.approval}
            onChange={(approval) => setAutomation({ approval })}
          />
        </View>
        <Divider />
        <ToggleRow title={L('النشر في أفضل وقت', 'Post at the best time')} subtitle={L('حسب نشاط جمهورك على كل منصة', 'Based on your audience on each platform')} value={a.bestTime} onChange={(bestTime) => setAutomation({ bestTime })} />
        <ToggleRow title={L('ترويج الريل الأنجح', 'Promote the best reel')} subtitle={L('ضمن السقف فقط', 'Within the cap only')} value={a.autoPromote} onChange={(autoPromote) => setAutomation({ autoPromote })} />
        <ToggleRow title={L('الرد على الرسائل', 'Answer messages')} subtitle={L('يسجّل الطلبات والحجوزات', 'Logs orders and bookings')} value={a.autoReply} onChange={(autoReply) => setAutomation({ autoReply })} />
        <ToggleRow
          title={L('أحِل إليّ الحالات الحساسة', 'Hand sensitive cases to me')}
          subtitle={L('الشكاوى، وتعديل الطلبات، والأسئلة التي لا جواب لها', 'Complaints, order changes, or questions with no answer')}
          value={a.escalate}
          onChange={(escalate) => setAutomation({ escalate })}
          last
        />
      </ListCard>

      <SectionTitle title={L('من يتولى كل خطوة', 'Who handles each step')} />
      <ListCard>
        {pipeline.map((step, i) => {
          const expanded = open === step.id;
          const names = step.tools.map((t) => tools[t].name).join(L('، ', ', '));
          return (
            <View key={step.id} style={i < pipeline.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.line }}>
              <PressableScale
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setOpen(expanded ? null : step.id)}
                pressedScale={1}
                style={styles.step}>
                <View style={[styles.num, { backgroundColor: c.tile }]}>
                  <AppText size={12.5} weight="bold" color={c.muted}>
                    {i + 1}
                  </AppText>
                </View>
                <View style={ui.flex}>
                  <AppText variant="rowTitle">
                    {pick(step.name)}
                  </AppText>
                  <AppText size={12} color={c.muted}>
                    {pick(step.detail)}
                  </AppText>
                  <View style={styles.chip}>{names ? <ModelChip label={names} /> : <Badge label={L('على الهاتف', 'On the phone')} />}</View>
                </View>
                <Icon name={expanded ? 'chevronUp' : 'chevronDown'} color={c.placeholder} size={16} />
              </PressableScale>
              {expanded && (
                <View style={[styles.platforms, { backgroundColor: c.tile }]}>
                  {shownPlatforms.map((p) => {
                    const ids = toolsFor(step, p);
                    return (
                      <View key={p} style={ui.between}>
                        <AppText size={12.5} color={c.muted}>
                          {pick(platformNames[p])}
                        </AppText>
                        <AppText size={12.5} weight="medium">
                          {ids.length ? ids.map((t) => tools[t].name).join(' + ') : L('محليًا على الهاتف', 'Locally on the phone')}
                        </AppText>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ListCard>

      <Note icon="shield">
        {L(
          'عند بلوغ السقف يتوقف كل إنفاق تلقائيًا ويصلك إشعار. لا يُنفَّذ أي شيء خارج القواعد أعلاه.',
          'At the cap, all spending stops automatically and you get a notice. Nothing runs outside the rules above.',
        )}
      </Note>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.card, padding: 16, gap: 14 },
  heroHead: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  bolt: { width: 40, height: 40, borderRadius: radius.control, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  master: { height: 48, borderRadius: radius.control, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  approval: { gap: 8, paddingVertical: 12, paddingHorizontal: 14 },
  chip: { marginTop: 6, alignItems: 'flex-start' },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  num: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  platforms: { borderRadius: radius.control, padding: 12, gap: 6, marginBottom: 12, marginHorizontal: 14 },
});
