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
import { useI18n } from '@/i18n';
import { aiErrorText, postJson, useAiStatus, useBusiness } from '@/lib/ai';
import { bestTimeHint } from '@/features/reel/shots';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

const publishable: Platform[] = ['instagram', 'facebook', 'tiktok', 'youtube'];

const hours = [10, 12, 13, 15, 17, 19, 20, 21, 22];
const recommended = new Set([20, 21]);

// Where and when the reel goes out: platforms, the caption the AI wrote for
// them, and the publish time — best time, right away, or a chosen slot.
export default function PublishScreen() {
  const { c } = useTheme();
  const { L, pick, lang, rtl } = useI18n();
  const { draft, updateDraft } = useStudio();
  const [editing, setEditing] = useState(false);
  const [writing, setWriting] = useState(false);
  const [captionNote, setCaptionNote] = useState<string | null>(null);
  const business = useBusiness();
  const status = useAiStatus();

  // A caption from Claude for this reel; if the AI is unavailable the
  // current text stays and the reason shows under it.
  const rewrite = async () => {
    setEditing(false);
    setWriting(true);
    try {
      const { caption } = await postJson<{ caption: string }>('/api/caption', {
        business,
        title: draft.title,
        platforms: draft.platforms.map((p) => platformNames[p].en),
        previous: draft.caption,
      });
      updateDraft({ caption });
      setCaptionNote(null);
    } catch (err) {
      setCaptionNote(aiErrorText(err, lang));
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
      header={<TopBar title={L('النشر', 'Posting')} subtitle={draft.title} />}
      footer={<Button label={L('التالي: الترويج', 'Next: promotion')} onPress={() => router.push('/reel/promote')} />}>
      <SectionTitle title={L('المنصات', 'Platforms')} />
      <View style={ui.wrap}>
        {publishable.map((p) => (
          <Chip key={p} label={pick(platformNames[p])} selected={draft.platforms.includes(p)} onPress={() => toggle(p)} />
        ))}
      </View>

      <SectionTitle title={L('الوصف', 'Caption')} />
      <Card>
        <View style={ui.between}>
          <Badge label={status === 'online' ? 'Claude' : L('المساعد', 'Assistant')} tone="pri" icon="sparkle" />
          <View style={styles.capActions}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={L('اكتب وصفًا آخر', 'Write another caption')}
              disabled={writing}
              onPress={rewrite}
              style={styles.capBtn}>
              <Icon name="refresh" color={c.primary} size={16} />
              <AppText size={12.5} weight="medium" color={c.primary}>
                {writing ? L('يكتب…', 'Writing…') : draft.caption ? L('نسخة أخرى', 'Another version') : L('اكتبه بالمساعد', 'Write with the assistant')}
              </AppText>
            </PressableScale>
            <PressableScale accessibilityRole="button" accessibilityLabel={L('عدّل الوصف', 'Edit caption')} onPress={() => setEditing((e) => !e)} style={styles.capBtn}>
              <Icon name={editing ? 'check' : 'edit'} color={c.primary} size={16} />
              <AppText size={12.5} weight="medium" color={c.primary}>
                {editing ? L('تم', 'Done') : L('تعديل', 'Edit')}
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
            style={[styles.input, { color: c.text, borderColor: c.line, backgroundColor: c.card, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }]}
            placeholderTextColor={c.placeholder}
          />
        ) : draft.caption ? (
          <AppText size={14} lineHeight={23}>
            {draft.caption}
          </AppText>
        ) : (
          <AppText size={13.5} color={c.muted} lineHeight={21}>
            {L('لا يوجد وصف بعد. دع المساعد يكتبه، أو اضغط «تعديل» واكتبه بنفسك.', 'No caption yet. Let the assistant write it, or tap Edit and write your own.')}
          </AppText>
        )}
        <AppText size={12} color={c.placeholder}>
          {captionNote ?? L('يأخذ تيك توك ويوتيوب نسخة أقصر تلقائيًا.', 'TikTok and YouTube get a shorter version automatically.')}
        </AppText>
      </Card>

      {draft.tier !== 'basic' && (
        <Card>
          <VoicePreview caption={draft.caption} />
        </Card>
      )}

      <SectionTitle title={L('وقت النشر', 'Posting time')} />
      <RadioCard selected={draft.when.kind === 'best'} onPress={() => updateDraft({ when: { kind: 'best' } })} label={L('أفضل وقت', 'Best time')}>
        <View style={styles.optionHead}>
          <AppText weight="semibold" size={15}>
            {L('أفضل وقت', 'Best time')}
          </AppText>
          <Badge label={L('موصى به', 'Recommended')} tone="ok" />
        </View>
        <AppText weight="medium" size={13.5}>
          {pick(bestTimeHint.label)}
        </AppText>
        <AppText size={12.5} color={c.muted} lineHeight={19}>
          {pick(bestTimeHint.reason)}
        </AppText>
      </RadioCard>

      <RadioCard selected={draft.when.kind === 'now'} onPress={() => updateDraft({ when: { kind: 'now' } })} label={L('الآن', 'Now')}>
        <AppText weight="semibold" size={15}>
          {L('الآن', 'Now')}
        </AppText>
        <AppText size={12.5} color={c.muted}>
          {L('يُنشر فور موافقتك على الريل النهائي', 'Posts as soon as you approve the final reel')}
        </AppText>
      </RadioCard>

      <RadioCard selected={draft.when.kind === 'custom'} onPress={() => updateDraft({ when: custom })} label={L('وقت أحدده', 'A time I choose')}>
        <AppText weight="semibold" size={15}>
          {L('وقت أحدده', 'A time I choose')}
        </AppText>
        <AppText size={12.5} color={c.muted}>
          {draft.when.kind === 'custom' ? `${dayLabel(custom.day, lang)}${L('، ', ', ')}${timeLabel(custom.hour, custom.minute, lang)}` : L('اختر اليوم والساعة', 'Pick the day and hour')}
        </AppText>
      </RadioCard>

      {draft.when.kind === 'custom' && (
        <Card>
          <AppText size={12.5} color={c.muted}>
            {L('اليوم', 'Day')}
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
                    {dayLabel(d, lang)}
                  </AppText>
                  <AppText size={11.5} color={active ? c.onPrimary : c.muted} style={ui.tabular}>
                    {dayDate(d)}
                  </AppText>
                </PressableScale>
              );
            })}
          </ScrollView>
          <AppText size={12.5} color={c.muted}>
            {L('الساعة', 'Hour')}
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
                    {timeLabel(h, minute, lang)}
                  </AppText>
                  {recommended.has(h) && <View style={[styles.rec, { backgroundColor: active ? c.onPrimary : c.ok }]} />}
                </PressableScale>
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={[styles.rec, { backgroundColor: c.ok }]} />
            <AppText size={12} color={c.muted}>
              {L('أوقات تفاعل عالٍ لجمهورك', 'High-engagement times for your audience')}
            </AppText>
          </View>
        </Card>
      )}

      <Note icon="globe">{L('الأوقات بتوقيت بغداد (UTC+3).', 'Times are Baghdad time (UTC+3).')}</Note>
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
    textAlignVertical: 'top',
  },
  optionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  days: { gap: 6, paddingVertical: 2 },
  day: { width: 70, height: 54, borderRadius: radius.control, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hour: { width: '31.5%', height: 40, borderRadius: radius.chip, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 },
  rec: { width: 6, height: 6, borderRadius: 3 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
