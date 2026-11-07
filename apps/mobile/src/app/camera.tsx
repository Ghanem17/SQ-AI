import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Appear, Badge, Card, ListCard, ListRow, Note, Progress, ScrollScreen, SectionTitle, TopBar } from '@/components/ui';
import { starterShots } from '@/features/reel/shots';
import { useI18n } from '@/i18n';
import { useSession } from '@/state/session';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

// The shooting plan for the current reel. Each shot opens the guided camera;
// once every shot is in, the reel moves on to quality and price.
export default function CameraScreen() {
  const { c } = useTheme();
  const { L, lang, n } = useI18n();
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
      <ScrollScreen header={<TopBar title={L('صوّر ريلًا', 'Shoot a reel')} />}>
        <View style={styles.intro}>
          <AppText variant="h1">{L('ابدأ ريلًا جديدًا', 'Start a new reel')}</AppText>
          <AppText variant="small" color={c.muted}>
            {L('اختر فكرة من المساعد أو ابدأ بلقطات أساسية، وسترشدك الكاميرا لقطةً بلقطة.', 'Pick an idea from the assistant or start with basic shots; the camera guides you shot by shot.')}
          </AppText>
        </View>
        <ListCard>
          <ListRow
            icon="sparkle"
            iconTone="solid"
            title={L('اقترح فكرة', 'Suggest an idea')}
            subtitle={
              creator
                ? L('ثلاث أفكار تناسب محتواك، تصبح إحداها قائمة لقطات جاهزة', 'Three ideas for your content; one becomes a ready shot list')
                : L('ثلاث أفكار تناسب نشاطك، تصبح إحداها قائمة لقطات جاهزة', 'Three ideas for your business; one becomes a ready shot list')
            }
            subtitleLines={2}
            onPress={() => router.push('/assistant')}
          />
          <ListRow
            icon="camera"
            title={L('لديك فكرة جاهزة؟', 'Already have an idea?')}
            subtitle={L('ابدأ بثلاث لقطات أساسية وسترشدك الكاميرا', 'Start with three basic shots; the camera guides you')}
            subtitleLines={2}
            onPress={() => startDraft(creator ? L('فيديو جديد', 'New video') : L('ريل جديد', 'New reel'), starters)}
            last
          />
        </ListCard>
        <Note icon="sun">
          {L('صوّر قرب ضوء طبيعي وثبّت الهاتف بكلتا يديك، والإطار عمودي 9:16.', 'Film near natural light, hold the phone with both hands, and keep it vertical 9:16.')}
        </Note>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen
      header={<TopBar title={draft.title} subtitle={L('قائمة اللقطات', 'Shot list')} />}
      footer={
        <>
          {complete ? (
            <Button label={L('التالي: اختر جودة الريل', 'Next: choose reel quality')} icon="arrow" iconEnd onPress={() => router.push('/reel/quality')} />
          ) : (
            <Button label={L(`صوّر اللقطة ${next + 1}`, `Film shot ${next + 1}`)} icon="camera" onPress={() => router.push({ pathname: '/capture', params: { shot: String(next) } })} />
          )}
        </>
      }>
      <Card>
        <View style={styles.between}>
          <AppText variant="h3">{L('تقدّم التصوير', 'Progress')}</AppText>
          <Badge label={L(`${done} من ${total}`, `${done} of ${total}`)} tone={complete ? 'ok' : 'warn'} />
        </View>
        <Progress value={done / total} />
        <AppText variant="small" color={c.muted}>
          {L(
            `المدة المتوقعة للريل: ${n(shots.reduce((a, x) => a + x.seconds, 0), 'second')} · الإطار عمودي 9:16`,
            `Expected length ${n(shots.reduce((a, x) => a + x.seconds, 0), 'second')} · vertical 9:16`,
          )}
        </AppText>
      </Card>

      <SectionTitle title={L('اللقطات', 'Shots')} />
      <Appear>
        <ListCard>
          {shots.map((shot, i) => {
            const captured = draft.captured.includes(i);
            const isNext = i === next;
            return (
              <PressableScale
                key={`${shot.title}${i}`}
                accessibilityRole="button"
                accessibilityLabel={L(`اللقطة ${i + 1}: ${shot.title}`, `Shot ${i + 1}: ${shot.title}`)}
                onPress={() => router.push({ pathname: '/capture', params: { shot: String(i) } })}
                pressedScale={1}
                style={[styles.shot, i < shots.length - 1 && { borderBottomColor: c.line, borderBottomWidth: 1 }]}>
                <View style={[styles.num, { backgroundColor: captured ? c.okSoft : isNext ? c.primary : c.tile }]}>
                  {captured ? (
                    <Icon name="check" color={c.ok} size={16} strokeWidth={2.2} />
                  ) : (
                    <AppText weight="bold" size={12.5} lineHeight={18} color={isNext ? c.onPrimary : c.muted}>
                      {i + 1}
                    </AppText>
                  )}
                </View>
                <View style={styles.shotText}>
                  <AppText variant="rowTitle" color={captured ? c.muted : c.text}>
                    {shot.title}
                  </AppText>
                  <AppText variant="small" color={c.muted}>
                    {shot.hint}
                  </AppText>
                  <View style={styles.meta}>
                    <Badge label={shot.angle} small />
                    <Badge label={L(`${shot.seconds} ث`, `${shot.seconds}s`)} icon="clock" small />
                    {captured && <Badge label={L('تم', 'Done')} tone="ok" small />}
                  </View>
                </View>
                <Icon name={captured ? 'refresh' : 'camera'} color={c.placeholder} size={18} />
              </PressableScale>
            );
          })}
        </ListCard>
      </Appear>

      <Note icon="sun">
        {L(
          'صوّر قرب ضوء طبيعي وثبّت الهاتف بكلتا يديك. في النسخة الكاملة يفحص التطبيق الإضاءة والاهتزاز تلقائيًا وينبهك إذا احتاجت اللقطة إلى إعادة.',
          'Film near natural light and hold the phone with both hands. The full version checks light and shake automatically and tells you when a shot needs a retake.',
        )}
      </Note>

      <View style={styles.links}>
        {!complete && done > 0 && (
          <Button variant="ghost" label={L('تخطَّ الباقي وأكمل بما صوّرته', 'Skip the rest and continue with what you filmed')} onPress={() => router.push('/reel/quality')} />
        )}
        {done > 0 && <Button variant="ghost" label={L('أعد جميع اللقطات', 'Redo all shots')} icon="refresh" colors={{ bg: 'transparent', fg: c.muted }} onPress={() => updateDraft({ captured: [] })} />}
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: 4, paddingTop: 4 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shot: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  num: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  shotText: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  links: { gap: 0 },
});
