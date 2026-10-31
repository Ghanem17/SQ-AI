import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { platformNames, radius, type Platform } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Badge, Card, Chip, Note, RadioCard, ScrollScreen, SectionTitle, TopBar, ui } from '@/components/ui';
import { VoicePreview } from '@/features/reel/VoicePreview';
import { dayDate, dayLabel, timeLabel } from '@/features/reel/when';
import { AiUnavailable, postJson, unavailableText, useAiStatus, useBusiness } from '@/lib/ai';
import { bestTime } from '@/mock/data';
import { defaultCaption, useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

const publishable: Platform[] = ['instagram', 'facebook', 'tiktok', 'youtube'];

const captions = [
  defaultCaption,
  'ورق عنب، رز، لحم، وليمون… الدولمة اللي تعرفها من بيت أهلك 🍋\nاطلب الآن، نوصل لكل بغداد.\n#دولمة #أكل_عراقي #بغداد',
  'صحن الدولمة اليوم طالع من الطبخ قبل ساعة.\nالكمية محدودة، احجز صحنك على الواتساب.\n#مطاعم_بغداد #دولمة #غداء',
];

const hours = [10, 12, 13, 15, 17, 19, 20, 21, 22];
const recommended = new Set([20, 21]);

// Where and when the reel goes out: platforms, the caption the AI wrote for
// them, and the publish time — best time, right away, or a chosen slot.
export default function PublishScreen() {
  const { c } = useTheme();
  const { draft, updateDraft } = useStudio();
  const [editing, setEditing] = useState(false);
  const [captionIndex, setCaptionIndex] = useState(0);
  const [writing, setWriting] = useState(false);
  const [captionNote, setCaptionNote] = useState<string | null>(null);
  const business = useBusiness();
  const status = useAiStatus();

  // A fresh caption from Claude; without the key, the next sample one.
  const rewrite = async () => {
    setEditing(false);
    setWriting(true);
    try {
      const { caption } = await postJson<{ caption: string }>('/api/caption', {
        business,
        title: draft.title,
        platforms: draft.platforms.map((p) => platformNames[p]),
        previous: draft.caption,
      });
      updateDraft({ caption });
      setCaptionNote(null);
    } catch (err) {
      const next = (captionIndex + 1) % captions.length;
      setCaptionIndex(next);
      updateDraft({ caption: captions[next] });
      setCaptionNote(err instanceof AiUnavailable ? unavailableText[err.reason] : unavailableText.failed);
    } finally {
      setWriting(false);
    }
  };
  const custom = draft.when.kind === 'custom' ? draft.when : { kind: 'custom' as const, day: 0, hour: 20, minute: 30 };

  const toggle = (p: Platform) => {
    const has = draft.platforms.includes(p);
    if (has && draft.platforms.length === 1) return;
    updateDraft({ platforms: has ? draft.platforms.filter((x) => x !== p) : [...draft.platforms, p] });
  };

  return (
    <ScrollScreen
      header={<TopBar title="النشر" subtitle={draft.title} />}
      footer={<Button label="التالي: الترويج" onPress={() => router.push('/reel/promote')} />}>
      <SectionTitle title="المنصات" />
      <View style={ui.wrap}>
        {publishable.map((p) => (
          <Chip key={p} label={platformNames[p]} selected={draft.platforms.includes(p)} onPress={() => toggle(p)} />
        ))}
      </View>

      <SectionTitle title="الكابشن" />
      <Card>
        <View style={ui.between}>
          <Badge label={status === 'online' ? 'Claude' : 'كتبه المساعد'} tone="pri" icon="sparkle" />
          <View style={styles.capActions}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="اكتب كابشن آخر"
              disabled={writing}
              onPress={rewrite}
              style={styles.capBtn}>
              <Icon name="refresh" color={c.primary} size={16} />
              <AppText size={12.5} weight="medium" color={c.primary}>
                {writing ? 'يكتب…' : 'نسخة أخرى'}
              </AppText>
            </PressableScale>
            <PressableScale accessibilityRole="button" accessibilityLabel="عدّل الكابشن" onPress={() => setEditing((e) => !e)} style={styles.capBtn}>
              <Icon name={editing ? 'check' : 'edit'} color={c.primary} size={16} />
              <AppText size={12.5} weight="medium" color={c.primary}>
                {editing ? 'تم' : 'تعديل'}
              </AppText>
            </PressableScale>
          </View>
        </View>
        {editing ? (
          <TextInput
            value={draft.caption}
            onChangeText={(caption) => updateDraft({ caption })}
            multiline
            autoFocus
            style={[styles.input, { color: c.text, borderColor: c.lineStrong, backgroundColor: c.tile }]}
            placeholderTextColor={c.placeholder}
          />
        ) : (
          <AppText size={14} lineHeight={23}>
            {draft.caption}
          </AppText>
        )}
        <AppText size={12} color={c.placeholder}>
          {captionNote ? `نسخة تجريبية · ${captionNote}` : 'تيك توك ويوتيوب يأخذان نسخة أقصر تلقائيًا.'}
        </AppText>
      </Card>

      {draft.tier !== 'basic' && (
        <Card>
          <VoicePreview caption={draft.caption} />
        </Card>
      )}

      <SectionTitle title="وقت النشر" />
      <RadioCard selected={draft.when.kind === 'best'} onPress={() => updateDraft({ when: { kind: 'best' } })} label="أفضل وقت">
        <View style={styles.optionHead}>
          <AppText weight="semibold" size={15}>
            أفضل وقت
          </AppText>
          <Badge label="موصى به" tone="ok" />
        </View>
        <AppText weight="medium" size={13.5}>
          {bestTime.label}
        </AppText>
        <AppText size={12.5} color={c.muted} lineHeight={19}>
          {bestTime.reason}
        </AppText>
      </RadioCard>

      <RadioCard selected={draft.when.kind === 'now'} onPress={() => updateDraft({ when: { kind: 'now' } })} label="الآن">
        <AppText weight="semibold" size={15}>
          الآن
        </AppText>
        <AppText size={12.5} color={c.muted}>
          يُنشر فور موافقتك على الريل النهائي
        </AppText>
      </RadioCard>

      <RadioCard selected={draft.when.kind === 'custom'} onPress={() => updateDraft({ when: custom })} label="وقت أحدده">
        <AppText weight="semibold" size={15}>
          وقت أحدده
        </AppText>
        <AppText size={12.5} color={c.muted}>
          {draft.when.kind === 'custom' ? `${dayLabel(custom.day)}، ${timeLabel(custom.hour, custom.minute)}` : 'اختر اليوم والساعة'}
        </AppText>
      </RadioCard>

      {draft.when.kind === 'custom' && (
        <Card>
          <AppText size={12.5} color={c.muted}>
            اليوم
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
            {Array.from({ length: 7 }, (_, d) => {
              const active = custom.day === d;
              return (
                <PressableScale
                  key={d}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  onPress={() => updateDraft({ when: { ...custom, day: d } })}
                  style={[styles.day, { borderColor: active ? c.primary : c.line, backgroundColor: active ? c.primary : c.card }]}>
                  <AppText size={12.5} weight="medium" color={active ? c.onPrimary : c.text}>
                    {dayLabel(d)}
                  </AppText>
                  <AppText size={11.5} color={active ? c.onPrimary : c.muted} style={ui.tabular}>
                    {dayDate(d)}
                  </AppText>
                </PressableScale>
              );
            })}
          </ScrollView>
          <AppText size={12.5} color={c.muted}>
            الساعة
          </AppText>
          <View style={styles.hours}>
            {hours.map((h) => {
              const minute = h === 20 ? 30 : 0;
              const active = custom.hour === h;
              return (
                <PressableScale
                  key={h}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  onPress={() => updateDraft({ when: { ...custom, hour: h, minute } })}
                  style={[styles.hour, { borderColor: active ? c.primary : c.line, backgroundColor: active ? c.primary : c.card }]}>
                  <AppText size={12.5} weight="medium" color={active ? c.onPrimary : c.text} style={ui.tabular}>
                    {timeLabel(h, minute)}
                  </AppText>
                  {recommended.has(h) && <View style={[styles.rec, { backgroundColor: active ? c.onPrimary : c.ok }]} />}
                </PressableScale>
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={[styles.rec, { backgroundColor: c.ok }]} />
            <AppText size={12} color={c.muted}>
              أوقات تفاعل عالية لجمهورك
            </AppText>
          </View>
        </Card>
      )}

      <Note icon="globe">التوقيت حسب توقيت بغداد (UTC+3).</Note>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  capActions: { flexDirection: 'row', gap: 4 },
  capBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36, paddingHorizontal: 6 },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: radius.control,
    padding: 12,
    fontFamily: 'ReadexPro_400Regular',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
    textAlignVertical: 'top',
    writingDirection: 'rtl',
  },
  optionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  days: { gap: 6, paddingVertical: 2 },
  day: { width: 70, height: 54, borderRadius: radius.control, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hour: { width: '31.5%', height: 40, borderRadius: radius.control, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 },
  rec: { width: 6, height: 6, borderRadius: 3 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
