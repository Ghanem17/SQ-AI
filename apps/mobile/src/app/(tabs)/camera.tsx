import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Appear, Badge, Card, Note, PageTitle, Progress, ScrollScreen, SectionTitle, ui } from '@/components/ui';
import { starterShots } from '@/features/reel/shots';
import { useSession } from '@/state/session';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

// The shooting plan for the current reel. Each shot opens the guided camera;
// once every shot is in, the reel moves on to quality and price.
export default function CameraTab() {
  const { c } = useTheme();
  const { draft, updateDraft, startDraft } = useStudio();
  const { accountType } = useSession();
  const creator = accountType === 'creator';
  const shots = draft.shots;
  const done = draft.captured.length;
  const total = shots.length;
  const next = shots.findIndex((_, i) => !draft.captured.includes(i));
  const complete = next === -1;

  if (!draft.active) {
    return (
      <ScrollScreen inTabs>
        <PageTitle title="التصوير" subtitle="ابدأ ريل جديد" />
        <Card style={styles.start}>
          <View style={[styles.startIcon, { backgroundColor: c.priSoft }]}>
            <Icon name="sparkle" color={c.onPriSoft} size={20} />
          </View>
          <AppText weight="semibold" size={16}>
            ما عندك فكرة؟
          </AppText>
          <AppText size={13} color={c.muted} lineHeight={20}>
            المساعد يقترح ثلاث أفكار تناسب {creator ? 'محتواك' : 'محلك'}، وتختار وحدة فتصير قائمة لقطات جاهزة.
          </AppText>
          <Button label="اقترح فكرة" icon="sparkle" onPress={() => router.push('/assistant')} />
        </Card>
        <Card style={styles.start}>
          <View style={[styles.startIcon, { backgroundColor: c.tile }]}>
            <Icon name="camera" color={c.text} size={20} />
          </View>
          <AppText weight="semibold" size={16}>
            عندك فكرة جاهزة؟
          </AppText>
          <AppText size={13} color={c.muted} lineHeight={20}>
            ابدأ بثلاث لقطات أساسية ({starterShots[creator ? 'creator' : 'shop'].map((s) => s.title).join('، ')}) والكاميرا توجّهك.
          </AppText>
          <Button
            label="ابدأ التصوير"
            icon="camera"
            variant="secondary"
            onPress={() => startDraft(creator ? 'فيديو جديد' : 'ريل جديد', starterShots[creator ? 'creator' : 'shop'])}
          />
        </Card>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen inTabs>
      <PageTitle title="التصوير" subtitle={draft.title} />

      <Card>
        <View style={ui.between}>
          <AppText weight="medium" size={13.5}>
            تقدّم التصوير
          </AppText>
          <AppText size={13} color={c.muted} style={ui.tabular}>
            {done} من {total} لقطات
          </AppText>
        </View>
        <Progress value={done / total} />
        <AppText size={12.5} color={c.muted}>
          المدة المتوقعة للريل {shots.reduce((a, x) => a + x.seconds, 0)} ثانية · الإطار عمودي 9:16
        </AppText>
      </Card>

      <SectionTitle title="قائمة اللقطات" />
      {shots.map((shot, i) => {
        const captured = draft.captured.includes(i);
        const isNext = i === next;
        return (
          <Appear key={shot.title} order={i}>
            <Card
              onPress={() => router.push({ pathname: '/capture', params: { shot: String(i) } })}
              accessibilityLabel={`اللقطة ${i + 1}: ${shot.title}`}
              style={[styles.shot, isNext && { borderColor: c.primary }]}>
              <View style={[styles.num, { backgroundColor: captured ? c.okSoft : isNext ? c.primary : c.tile }]}>
                {captured ? (
                  <Icon name="check" color={c.ok} size={16} strokeWidth={2.4} />
                ) : (
                  <AppText weight="semibold" size={14} color={isNext ? c.onPrimary : c.muted}>
                    {i + 1}
                  </AppText>
                )}
              </View>
              <View style={[ui.flex, styles.shotText]}>
                <AppText weight="semibold" size={14.5}>
                  {shot.title}
                </AppText>
                <AppText size={12.5} color={c.muted}>
                  {shot.hint}
                </AppText>
                <View style={styles.meta}>
                  <Badge label={shot.angle} />
                  <Badge label={`${shot.seconds} ث`} icon="clock" />
                  {captured && <Badge label="تم" tone="ok" />}
                </View>
              </View>
              <Icon name={captured ? 'refresh' : 'camera'} color={c.muted} size={18} />
            </Card>
          </Appear>
        );
      })}

      <Note icon="sun">
        صوّر قرب ضوء طبيعي وثبّت الموبايل بيدين. في النسخة الكاملة يفحص التطبيق الإضاءة والاهتزاز تلقائيًا وينبهك إذا احتاجت اللقطة إعادة.
      </Note>

      <View style={styles.actions}>
        {complete ? (
          <Button label="التالي: اختر جودة الريل" icon="layers" onPress={() => router.push('/reel/quality')} />
        ) : (
          <Button
            label={`صوّر اللقطة ${next + 1}`}
            icon="camera"
            onPress={() => router.push({ pathname: '/capture', params: { shot: String(next) } })}
          />
        )}
        {!complete && done > 0 && (
          <PressableScale accessibilityRole="button" onPress={() => router.push('/reel/quality')} style={styles.link}>
            <AppText size={13.5} weight="medium" color={c.primary}>
              تخطَّ الباقي، نكمل بما صوّرته
            </AppText>
          </PressableScale>
        )}
        {done > 0 && (
          <PressableScale accessibilityRole="button" onPress={() => updateDraft({ captured: [] })} style={styles.link}>
            <AppText size={13} color={c.muted}>
              أعد كل اللقطات
            </AppText>
          </PressableScale>
        )}
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  start: { gap: 8 },
  startIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  shot: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  num: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  shotText: { gap: 4 },
  meta: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  actions: { gap: 4, marginTop: 6 },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
