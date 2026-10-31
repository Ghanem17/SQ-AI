import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Appear, Badge, Card, Note, PageTitle, Progress, ScrollScreen, SectionTitle, ui } from '@/components/ui';
import { todayShots } from '@/mock/data';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

// The shooting plan for the current reel. Each shot opens the guided camera;
// once every shot is in, the reel moves on to quality and price.
export default function CameraTab() {
  const { c } = useTheme();
  const { draft, updateDraft } = useStudio();
  const done = draft.captured.length;
  const total = todayShots.length;
  const next = todayShots.findIndex((_, i) => !draft.captured.includes(i));
  const complete = next === -1;

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
          المدة المتوقعة للريل 15 ثانية · الإطار عمودي 9:16
        </AppText>
      </Card>

      <SectionTitle title="قائمة اللقطات" />
      {todayShots.map((shot, i) => {
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
              ابدأ التصوير من جديد
            </AppText>
          </PressableScale>
        )}
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  shot: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  num: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  shotText: { gap: 4 },
  meta: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  actions: { gap: 4, marginTop: 6 },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
