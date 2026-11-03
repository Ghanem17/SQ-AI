import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View, type ScrollViewInstance } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { Badge, Card, TopBar, ui } from '@/components/ui';
import { AiUnavailable, postJson, unavailableText, useAiStatus, useBusiness } from '@/lib/ai';
import { starterShots, type Shot } from '@/features/reel/shots';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

type Idea = { title: string; hook: string; why: string };
type ApiReply = { text?: string; ideas?: Idea[]; shots?: Shot[] };

type Entry =
  | { id: number; from: 'me'; text: string }
  | { id: number; from: 'ai'; text: string; ideas?: Idea[]; shots?: Shot[]; idea?: Idea; offline?: string };

const tips =
  'ثلاث قواعد تفرق كثيرًا:\n1. صوّر قرب شباك، والضوء يجي من الجنب مو من الخلف.\n2. ثبّت الموبايل بيدين أو على كوب، وتحرك ببطء.\n3. أول ثانيتين أهم شي: ابدأ بأقرب لقطة وأشهى منظر.';

// What the model has seen so far, as plain chat turns.
function history(entries: Entry[]) {
  return entries.slice(1).map((e) => {
    if (e.from === 'me') return { role: 'user' as const, content: e.text };
    const parts = [e.text];
    if (e.ideas) parts.push(`الأفكار: ${e.ideas.map((i) => i.title).join('، ')}`);
    if (e.shots) parts.push(`اللقطات: ${e.shots.map((s) => s.title).join('، ')}`);
    return { role: 'assistant' as const, content: parts.filter(Boolean).join('\n') };
  });
}

// The assistant for "I don't know what to film": quick prompts, ideas tied to
// the account, and a shot list that opens the camera. Uses Claude through
// fal.ai; without it the assistant says so and offers the starter shot list.
export default function AssistantScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const business = useBusiness();
  const status = useAiStatus();
  const { startDraft } = useStudio();
  const [entries, setEntries] = useState<Entry[]>([
    { id: 0, from: 'ai', text: 'أهلًا، أنا مساعد SQ. أقترح عليك ماذا تصوّر، وأحوّل الفكرة لقائمة لقطات جاهزة تفتح الكاميرا مباشرة.' },
  ]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const nextId = useRef(1);

  useEffect(() => {
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: !reduceMotion }), 50);
    return () => clearTimeout(t);
  }, [entries, busy, reduceMotion]);

  const send = async (userText: string, idea?: Idea) => {
    const body = userText.trim();
    if (!body || busy) return;
    const mine: Entry = { id: nextId.current++, from: 'me', text: body };
    const next = [...entries, mine];
    setEntries(next);
    setText('');
    setBusy(true);
    const id = nextId.current++;
    try {
      const reply = await postJson<ApiReply>('/api/assistant', { business, messages: history(next) });
      setEntries((e) => [...e, { id, from: 'ai', text: reply.text ?? '', ideas: reply.ideas, shots: reply.shots, idea }]);
    } catch (err) {
      // Without the AI: general filming tips and the starter shot list are
      // still true for anyone; ideas are not made up.
      const offline = err instanceof AiUnavailable ? unavailableText[err.reason] : unavailableText.failed;
      const fallback: Entry = idea
        ? { id, from: 'ai', text: 'المساعد غير متاح الآن، فهذه قائمة لقطات أساسية تنفع لأي فكرة:', shots: starterShots[business.kind], idea, offline }
        : /كيف|نصيح|ضو|إضاء|اضاء/.test(body)
          ? { id, from: 'ai', text: tips, offline }
          : { id, from: 'ai', text: 'ما قدرت أجهّز أفكارًا الآن.', offline };
      setEntries((e) => [...e, fallback]);
    } finally {
      setBusy(false);
    }
  };

  const prompts = ['شو أصوّر اليوم؟', 'فكرة لعرض نهاية الأسبوع', 'كيف أصوّر الأكل بشكل أحلى؟'];

  return (
    <Screen edges={['top']}>
      <TopBar
        title="المساعد"
        subtitle="أفكار وقوائم لقطات"
        mode="close"
        right={status === 'online' ? <Badge label="Claude متصل" tone="ok" /> : status === 'locked' ? <Badge label="يحتاج رمز" tone="acc" /> : status === 'offline' ? <Badge label="غير متصل" /> : undefined}
      />
      <KeyboardAvoidingView style={ui.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={styles.thread} keyboardShouldPersistTaps="handled">
          {entries.map((e) => (
            <Animated.View key={e.id} entering={reduceMotion ? undefined : FadeIn.duration(220)} style={styles.block}>
              {e.from === 'me' ? (
                <View style={[styles.bubble, styles.me, { backgroundColor: c.primary }]}>
                  <AppText size={14} lineHeight={22} color={c.onPrimary}>
                    {e.text}
                  </AppText>
                </View>
              ) : (
                <>
                  {!!e.text && (
                    <View style={[styles.bubble, styles.ai, { backgroundColor: c.tile }]}>
                      <AppText size={14} lineHeight={22}>
                        {e.text}
                      </AppText>
                    </View>
                  )}
                  {e.ideas?.map((idea) => (
                    <Card key={idea.title} onPress={() => send(`خلينا نصوّر: ${idea.title}. أعطني قائمة اللقطات.`, idea)} accessibilityLabel={idea.title}>
                      <AppText weight="semibold" size={14.5}>
                        {idea.title}
                      </AppText>
                      <AppText size={13}>{idea.hook}</AppText>
                      <View style={styles.why}>
                        <Icon name="trend" color={c.ok} size={13} />
                        <AppText size={12} color={c.muted} style={ui.flex}>
                          {idea.why}
                        </AppText>
                      </View>
                      <AppText size={12.5} weight="medium" color={c.primary}>
                        اختر هذه الفكرة
                      </AppText>
                    </Card>
                  ))}
                  {e.shots && e.shots.length > 0 && (
                    <Card>
                      {e.idea && (
                        <AppText weight="semibold" size={14.5}>
                          {e.idea.title}
                        </AppText>
                      )}
                      {e.shots.map((s, i) => (
                        <View key={`${s.title}${i}`} style={styles.shot}>
                          <View style={[styles.num, { backgroundColor: c.tile }]}>
                            <AppText size={12} weight="semibold" color={c.muted}>
                              {i + 1}
                            </AppText>
                          </View>
                          <View style={ui.flex}>
                            <AppText size={13.5} weight="medium">
                              {s.title}
                            </AppText>
                            <AppText size={12} color={c.muted}>
                              {s.hint}
                            </AppText>
                          </View>
                          <Badge label={`${s.seconds} ث`} />
                        </View>
                      ))}
                      <Button
                        label="ابدأ التصوير"
                        icon="camera"
                        height={44}
                        onPress={() => {
                          startDraft(e.idea?.title ?? 'ريل جديد', e.shots);
                          router.dismissTo('/(tabs)/camera');
                        }}
                      />
                    </Card>
                  )}
                  {e.offline && (
                    <AppText size={11.5} color={c.placeholder}>
                      {e.offline}
                    </AppText>
                  )}
                </>
              )}
            </Animated.View>
          ))}
          {busy && (
            <View style={[styles.bubble, styles.ai, styles.typing, { backgroundColor: c.tile }]}>
              <AppText size={13} color={c.muted}>
                يكتب…
              </AppText>
            </View>
          )}
        </ScrollView>

        <View style={[styles.composer, { borderTopColor: c.line, backgroundColor: c.bg, paddingBottom: insets.bottom + 8 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prompts} keyboardShouldPersistTaps="handled">
            {prompts.map((p) => (
              <PressableScale key={p} accessibilityRole="button" disabled={busy} onPress={() => send(p)} style={[styles.prompt, { borderColor: c.line }]}>
                <AppText size={12.5} color={c.text}>
                  {p}
                </AppText>
              </PressableScale>
            ))}
          </ScrollView>
          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="اسأل عن فكرة أو نصيحة تصوير"
              placeholderTextColor={c.placeholder}
              style={[styles.input, { color: c.text, backgroundColor: c.tile }]}
              onSubmitEditing={() => send(text)}
              returnKeyType="send"
            />
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="أرسل"
              disabled={!text.trim() || busy}
              onPress={() => send(text)}
              style={[styles.send, { backgroundColor: text.trim() ? c.primary : c.tile }]}>
              <Icon name="send" color={text.trim() ? c.onPrimary : c.placeholder} size={18} />
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  thread: { padding: 16, gap: 12 },
  block: { gap: 8 },
  bubble: { maxWidth: '86%', paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.tile },
  me: { alignSelf: 'flex-end', borderBottomLeftRadius: 4 },
  ai: { alignSelf: 'flex-start', borderBottomRightRadius: 4 },
  typing: { paddingVertical: 6 },
  why: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shot: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2 },
  num: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, gap: 8 },
  prompts: { gap: 6, paddingHorizontal: 12 },
  prompt: { height: 34, paddingHorizontal: 12, borderRadius: radius.control, borderWidth: 1, justifyContent: 'center' },
  inputRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  input: { flex: 1, height: 44, borderRadius: radius.control, paddingHorizontal: 14, fontFamily: 'ReadexPro_400Regular', fontSize: 14, textAlign: 'right' },
  send: { width: 44, height: 44, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
});
