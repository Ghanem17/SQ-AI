import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Appear, Badge, Card, Note, PageTitle, Progress, ScrollScreen, SectionTitle, ui } from '@/components/ui';
import { starterShots } from '@/features/reel/shots';
import { useI18n } from '@/i18n';
import { useSession } from '@/state/session';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

// The shooting plan for the current reel. Each shot opens the guided camera;
// once every shot is in, the reel moves on to quality and price.
export default function CameraTab() {
  const { c } = useTheme();
  const { L, lang } = useI18n();
  const { draft, updateDraft, startDraft } = useStudio();
  const { accountType } = useSession();
  const creator = accountType === 'creator';
  const shots = draft.shots;
  const done = draft.captured.length;
  const total = shots.length;
  const next = shots.findIndex((_, i) => !draft.captured.includes(i));
  const complete = next === -1;
  const starters = starterShots(creator ? 'creator' : 'shop', lang);

  if (!draft.active) {
    return (
      <ScrollScreen inTabs>
        <PageTitle title={L('التصوير', 'Filming')} subtitle={L('ابدأ ريلًا جديدًا', 'Start a new reel')} />
        <Card style={styles.start}>
          <View style={[styles.startIcon, { backgroundColor: c.priSoft }]}>
            <Icon name="sparkle" color={c.onPriSoft} size={20} />
          </View>
          <AppText weight="semibold" size={16}>
            {L('ليست لديك فكرة؟', 'No idea yet?')}
          </AppText>
          <AppText size={13} color={c.muted} lineHeight={20}>
            {creator
              ? L('يقترح المساعد ثلاث أفكار تناسب محتواك، فتختار إحداها لتصبح قائمة لقطات جاهزة.', 'The assistant suggests three ideas for your content; pick one and it becomes a ready shot list.')
              : L('يقترح المساعد ثلاث أفكار تناسب نشاطك، فتختار إحداها لتصبح قائمة لقطات جاهزة.', 'The assistant suggests three ideas for your business; pick one and it becomes a ready shot list.')}
          </AppText>
          <Button label={L('اقترح فكرة', 'Suggest an idea')} icon="sparkle" onPress={() => router.push('/assistant')} />
        </Card>
        <Card style={styles.start}>
          <View style={[styles.startIcon, { backgroundColor: c.tile }]}>
            <Icon name="camera" color={c.text} size={20} />
          </View>
          <AppText weight="semibold" size={16}>
            {L('لديك فكرة جاهزة؟', 'Already have an idea?')}
          </AppText>
          <AppText size={13} color={c.muted} lineHeight={20}>
            {L(
              `ابدأ بثلاث لقطات أساسية (${starters.map((s) => s.title).join('، ')}) وسترشدك الكاميرا.`,
              `Start with three basic shots (${starters.map((s) => s.title).join(', ')}) and the camera guides you.`,
            )}
          </AppText>
          <Button
            label={L('ابدأ التصوير', 'Start filming')}
            icon="camera"
            variant="secondary"
            onPress={() => startDraft(creator ? L('فيديو جديد', 'New video') : L('ريل جديد', 'New reel'), starters)}
          />
        </Card>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen inTabs>
      <PageTitle title={L('التصوير', 'Filming')} subtitle={draft.title} />

      <Card>
        <View style={ui.between}>
          <AppText weight="medium" size={13.5}>
            {L('تقدّم التصوير', 'Progress')}
          </AppText>
          <AppText size={13} color={c.muted} style={ui.tabular}>
            {L(`${done} من ${total} لقطات`, `${done} of ${total} shots`)}
          </AppText>
        </View>
        <Progress value={done / total} />
        <AppText size={12.5} color={c.muted}>
          {L(
            `المدة المتوقعة للريل ${shots.reduce((a, x) => a + x.seconds, 0)} ثانية · الإطار عمودي 9:16`,
            `Expected length ${shots.reduce((a, x) => a + x.seconds, 0)} seconds · vertical 9:16`,
          )}
        </AppText>
      </Card>

      <SectionTitle title={L('قائمة اللقطات', 'Shot list')} />
      {shots.map((shot, i) => {
        const captured = draft.captured.includes(i);
        const isNext = i === next;
        return (
          <Appear key={shot.title} order={i}>
            <Card
              onPress={() => router.push({ pathname: '/capture', params: { shot: String(i) } })}
              accessibilityLabel={L(`اللقطة ${i + 1}: ${shot.title}`, `Shot ${i + 1}: ${shot.title}`)}
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
                  <Badge label={L(`${shot.seconds} ث`, `${shot.seconds}s`)} icon="clock" />
                  {captured && <Badge label={L('تم', 'Done')} tone="ok" />}
                </View>
              </View>
              <Icon name={captured ? 'refresh' : 'camera'} color={c.muted} size={18} />
            </Card>
          </Appear>
        );
      })}

      <Note icon="sun">
        {L(
          'صوّر قرب ضوء طبيعي وثبّت الهاتف بكلتا يديك. في النسخة الكاملة يفحص التطبيق الإضاءة والاهتزاز تلقائيًا وينبهك إذا احتاجت اللقطة إلى إعادة.',
          'Film near natural light and hold the phone with both hands. The full version checks light and shake automatically and tells you when a shot needs a retake.',
        )}
      </Note>

      <View style={styles.actions}>
        {complete ? (
          <Button label={L('التالي: اختر جودة الريل', 'Next: choose reel quality')} icon="layers" onPress={() => router.push('/reel/quality')} />
        ) : (
          <Button
            label={L(`صوّر اللقطة ${next + 1}`, `Film shot ${next + 1}`)}
            icon="camera"
            onPress={() => router.push({ pathname: '/capture', params: { shot: String(next) } })}
          />
        )}
        {!complete && done > 0 && (
          <PressableScale accessibilityRole="button" onPress={() => router.push('/reel/quality')} style={styles.link}>
            <AppText size={13.5} weight="medium" color={c.primary}>
              {L('تخطَّ الباقي وأكمل بما صوّرته', 'Skip the rest and continue with what you filmed')}
            </AppText>
          </PressableScale>
        )}
        {done > 0 && (
          <PressableScale accessibilityRole="button" onPress={() => updateDraft({ captured: [] })} style={styles.link}>
            <AppText size={13} color={c.muted}>
              {L('أعد جميع اللقطات', 'Redo all shots')}
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
