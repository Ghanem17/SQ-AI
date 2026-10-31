import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatIQD, pipeline, platformNames, tools, toolsFor, type Platform } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Badge, Card, Divider, Note, Progress, ScrollScreen, SectionTitle, Segmented, Stepper, ToggleRow, TopBar, ui } from '@/components/ui';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

const shownPlatforms: Platform[] = ['instagram', 'facebook', 'tiktok', 'whatsapp'];

// Full automation: one switch, a monthly spending cap, and the map of which
// AI or platform API handles every step, per platform.
export default function AutomationScreen() {
  const { c } = useTheme();
  const { automation: a, setAutomation, spentThisMonth } = useStudio();
  const [open, setOpen] = useState<string | null>(null);
  const left = Math.max(0, a.monthlyCap - spentThisMonth);

  return (
    <ScrollScreen header={<TopBar title="الوضع التلقائي" subtitle={a.enabled ? 'يعمل' : 'متوقف'} />}>
      <Card tone="hero">
        <View style={styles.heroHead}>
          <View style={[styles.bolt, { backgroundColor: a.enabled ? c.navActive : 'rgba(255,255,255,0.12)' }]}>
            <Icon name="bolt" color={a.enabled ? c.onNavActive : c.heroText} size={18} strokeWidth={2} />
          </View>
          <View style={ui.flex}>
            <AppText weight="semibold" size={16} color={c.heroText}>
              كل شي تلقائي
            </AppText>
            <AppText size={12.5} color={c.heroMuted} lineHeight={19}>
              فكرة، تصوير موجّه، مونتاج، نشر، ترويج، ورد على الزبائن، بدون أي تدخل يدوي من الوكالة.
            </AppText>
          </View>
        </View>
        <PressableScale
          accessibilityRole="switch"
          accessibilityState={{ checked: a.enabled }}
          onPress={() => setAutomation({ enabled: !a.enabled })}
          style={[styles.master, { backgroundColor: a.enabled ? c.navActive : c.heroBtn }]}>
          <AppText weight="semibold" size={15} color={a.enabled ? c.onNavActive : c.heroBtnText}>
            {a.enabled ? 'يعمل الآن · اضغط للإيقاف' : 'شغّل الوضع التلقائي'}
          </AppText>
        </PressableScale>
      </Card>

      <SectionTitle title="سقف الصرف الشهري" />
      <Card>
        <View style={ui.between}>
          <View style={ui.flex}>
            <AppText weight="medium" size={14}>
              الحد الأقصى للشهر
            </AppText>
            <AppText size={12} color={c.muted}>
              ريلز وإعلانات معًا
            </AppText>
          </View>
          <Stepper value={a.monthlyCap} onChange={(monthlyCap) => setAutomation({ monthlyCap })} min={100000} max={5000000} step={100000} format={(v) => `${v / 1000} ألف`} />
        </View>
        <Progress value={spentThisMonth / a.monthlyCap} color={spentThisMonth > a.monthlyCap * 0.9 ? c.bad : undefined} />
        <View style={ui.between}>
          <AppText size={12.5} color={c.muted} style={ui.tabular}>
            صُرف {formatIQD(spentThisMonth)}
          </AppText>
          <AppText size={12.5} color={c.muted} style={ui.tabular}>
            المتبقي {formatIQD(left)}
          </AppText>
        </View>
      </Card>

      <SectionTitle title="القواعد" />
      <Card style={styles.rules}>
        <View style={styles.approval}>
          <AppText weight="medium" size={14.5}>
            قبل النشر
          </AppText>
          <Segmented
            options={[
              { value: 'ask', label: 'اسألني أولًا' },
              { value: 'auto', label: 'انشر مباشرة' },
            ]}
            value={a.approval}
            onChange={(approval) => setAutomation({ approval })}
          />
        </View>
        <Divider />
        <ToggleRow title="النشر في أفضل وقت" subtitle="حسب نشاط جمهورك على كل منصة" value={a.bestTime} onChange={(bestTime) => setAutomation({ bestTime })} />
        <ToggleRow title="ترويج الريل الأنجح" subtitle="ضمن السقف فقط" value={a.autoPromote} onChange={(autoPromote) => setAutomation({ autoPromote })} />
        <ToggleRow title="الرد على الرسائل" subtitle="يسجّل الطلبات والحجوزات" value={a.autoReply} onChange={(autoReply) => setAutomation({ autoReply })} />
        <ToggleRow
          title="حوّل الحالات الحساسة لي"
          subtitle="شكاوى، تعديل طلب، أو أسئلة بلا جواب"
          value={a.escalate}
          onChange={(escalate) => setAutomation({ escalate })}
          last
        />
      </Card>

      <SectionTitle title="مين يشتغل على كل خطوة" />
      <Card style={styles.rules}>
        {pipeline.map((step, i) => {
          const expanded = open === step.id;
          const names = step.tools.map((t) => tools[t].name).join('، ');
          return (
            <View key={step.id} style={i < pipeline.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line }}>
              <PressableScale
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setOpen(expanded ? null : step.id)}
                pressedScale={1}
                style={styles.step}>
                <View style={[styles.num, { backgroundColor: c.tile }]}>
                  <AppText size={12} weight="semibold" color={c.muted} style={ui.tabular}>
                    {i + 1}
                  </AppText>
                </View>
                <View style={ui.flex}>
                  <AppText weight="medium" size={14.5}>
                    {step.name}
                  </AppText>
                  <AppText size={12} color={c.muted}>
                    {step.detail}
                  </AppText>
                </View>
                {names ? <Badge label={names} tone="pri" /> : <Badge label="على الموبايل" />}
                <Icon name={expanded ? 'chevronUp' : 'chevronDown'} color={c.placeholder} size={16} />
              </PressableScale>
              {expanded && (
                <View style={[styles.platforms, { backgroundColor: c.tile }]}>
                  {shownPlatforms.map((p) => {
                    const ids = toolsFor(step, p);
                    return (
                      <View key={p} style={ui.between}>
                        <AppText size={12.5} color={c.muted}>
                          {platformNames[p]}
                        </AppText>
                        <AppText size={12.5} weight="medium">
                          {ids.length ? ids.map((t) => tools[t].name).join(' + ') : 'محليًا على الموبايل'}
                        </AppText>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </Card>

      <Note icon="shield">عند الوصول للسقف يتوقف كل صرف تلقائيًا ويصلك إشعار. لا يُنفَّذ أي شيء خارج القواعد أعلاه.</Note>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  heroHead: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  bolt: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  master: { height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  rules: { paddingVertical: 4, gap: 0 },
  approval: { gap: 8, paddingVertical: 10 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  num: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  platforms: { borderRadius: 8, padding: 10, gap: 6, marginBottom: 12 },
});
