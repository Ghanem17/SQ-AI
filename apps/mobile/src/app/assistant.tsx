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
import { Badge, Card, IconBadge, TopBar, ui } from '@/components/ui';
import { useI18n } from '@/i18n';
import { aiErrorText, postJson, useAiStatus, useBusiness } from '@/lib/ai';
import { starterShots, type Shot } from '@/features/reel/shots';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

type Idea = { title: string; hook: string; why: string };
type ApiReply = { text?: string; ideas?: Idea[]; shots?: Shot[] };

type Entry =
  | { id: number; from: 'me'; text: string }
  | { id: number; from: 'ai'; text: string; ideas?: Idea[]; shots?: Shot[]; idea?: Idea; offline?: string };

const tips = {
  ar: 'ثلاث قواعد تصنع فرقًا كبيرًا:\n1. صوّر قرب نافذة، وليكن الضوء من الجانب لا من الخلف.\n2. ثبّت الهاتف بكلتا يديك أو أسنده إلى كوب، وتحرك ببطء.\n3. الثانيتان الأوليان هما الأهم: ابدأ بأقرب لقطة وأجمل منظر.',
  en: 'Three rules that make a big difference:\n1. Film near a window, with light from the side, not from behind.\n2. Hold the phone with both hands or rest it on a cup, and move slowly.\n3. The first two seconds matter most: open on your closest, best-looking shot.',
};

// What the model has seen so far, as plain chat turns.
function history(entries: Entry[]) {
  return entries.slice(1).map((e) => {
    if (e.from === 'me') return { role: 'user' as const, content: e.text };
    const parts = [e.text];
    if (e.ideas) parts.push(`Ideas: ${e.ideas.map((i) => i.title).join(' | ')}`);
    if (e.shots) parts.push(`Shots: ${e.shots.map((s) => s.title).join(' | ')}`);
    return { role: 'assistant' as const, content: parts.filter(Boolean).join('\n') };
  });
}

// The assistant for "I don't know what to film": quick prompts, ideas tied to
// the account, and a shot list that opens the camera. Uses Claude through
// fal.ai; without it the assistant says so and offers the starter shot list.
export default function AssistantScreen() {
  const { c } = useTheme();
  const { L, lang, rtl } = useI18n();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const business = useBusiness();
  const status = useAiStatus();
  const { startDraft } = useStudio();
  const [entries, setEntries] = useState<Entry[]>([
    {
      id: 0,
      from: 'ai',
      text: L(
        'أهلًا بك، أنا مساعد SQ. أقترح عليك ما تصوّره، وأحوّل الفكرة إلى قائمة لقطات جاهزة تفتح الكاميرا مباشرة.',
        'Hello, I am the SQ assistant. I suggest what to film and turn the idea into a ready shot list that opens the camera.',
      ),
    },
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
      const offline = aiErrorText(err, lang);
      const fallback: Entry = idea
        ? {
            id,
            from: 'ai',
            text: L('المساعد غير متاح الآن، وهذه قائمة لقطات أساسية تصلح لأي فكرة:', 'The assistant is not available now; here is a basic shot list that suits any idea:'),
            shots: starterShots(business.kind, lang),
            idea,
            offline,
          }
        : /كيف|نصيح|ضو|إضاء|اضاء|how|tip|light/i.test(body)
          ? { id, from: 'ai', text: tips[lang], offline }
          : { id, from: 'ai', text: L('تعذر تجهيز الأفكار الآن.', 'Could not prepare ideas right now.'), offline };
      setEntries((e) => [...e, fallback]);
    } finally {
      setBusy(false);
    }
  };

  const prompts = lang === 'ar'
    ? ['ماذا أصوّر اليوم؟', 'فكرة لعرض نهاية الأسبوع', 'كيف أصوّر الطعام بشكل أجمل؟']
    : ['What should I film today?', 'An idea for a weekend offer', 'How do I film food so it looks better?'];

  return (
    <Screen edges={['top']}>
      <TopBar
        title={L('المساعد', 'Assistant')}
        subtitle={L('أفكار وقوائم لقطات', 'Ideas and shot lists')}
        mode="close"
        right={
          status === 'online' ? (
            <Badge label={L('Claude متصل', 'Claude online')} tone="ok" />
          ) : status === 'locked' ? (
            <Badge label={L('يحتاج إلى رمز', 'Needs code')} tone="acc" />
          ) : status === 'offline' ? (
            <Badge label={L('غير متصل', 'Offline')} />
          ) : undefined
        }
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
                    <View style={[styles.bubble, styles.ai, { backgroundColor: c.card, borderColor: c.line, borderWidth: 1 }]}>
                      <AppText size={14} lineHeight={22}>
                        {e.text}
                      </AppText>
                    </View>
                  )}
                  {e.ideas?.map((idea) => (
                    <Card key={idea.title} onPress={() => send(L(`لنصوّر: ${idea.title}. أعطني قائمة اللقطات.`, `Let's film: ${idea.title}. Give me the shot list.`), idea)} accessibilityLabel={idea.title}>
                      <View style={styles.ideaHead}>
                        <IconBadge icon="bulb" size={34} />
                        <AppText variant="rowTitle" style={ui.flex}>
                          {idea.title}
                        </AppText>
                      </View>
                      <AppText size={13}>{idea.hook}</AppText>
                      <View style={styles.why}>
                        <Icon name="trend" color={c.ok} size={13} />
                        <AppText size={12} color={c.muted} style={ui.flex}>
                          {idea.why}
                        </AppText>
                      </View>
                      <View style={styles.choose}>
                        <AppText size={12.5} weight="semibold">
                          {L('اختر هذه الفكرة', 'Choose this idea')}
                        </AppText>
                        <Icon name="chevronLeft" color={c.placeholder} size={14} />
                      </View>
                    </Card>
                  ))}
                  {e.shots && e.shots.length > 0 && (
                    <Card>
                      {e.idea && (
                        <AppText variant="h3">
                          {e.idea.title}
                        </AppText>
                      )}
                      {e.shots.map((s, i) => (
                        <View key={`${s.title}${i}`} style={styles.shot}>
                          <View style={[styles.num, { backgroundColor: c.tile }]}>
                            <AppText size={12.5} weight="bold" color={c.muted}>
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
                          <Badge label={L(`${s.seconds} ث`, `${s.seconds}s`)} />
                        </View>
                      ))}
                      <Button
                        label={L('ابدأ التصوير', 'Start filming')}
                        icon="camera"
                        onPress={() => {
                          startDraft(e.idea?.title ?? L('ريل جديد', 'New reel'), e.shots);
                          router.dismissTo('/camera');
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
            <View style={[styles.bubble, styles.ai, styles.typing, { backgroundColor: c.card, borderColor: c.line, borderWidth: 1 }]}>
              <AppText size={13} color={c.muted}>
                {L('يكتب…', 'Typing…')}
              </AppText>
            </View>
          )}
        </ScrollView>

        <View style={[styles.composer, { borderTopColor: c.line, backgroundColor: c.nav, paddingBottom: insets.bottom + 10 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prompts} keyboardShouldPersistTaps="handled">
            {prompts.map((p) => (
              <PressableScale key={p} accessibilityRole="button" disabled={busy} onPress={() => send(p)} style={[styles.prompt, { borderColor: c.line, backgroundColor: c.card }]}>
                <AppText size={12.5} weight="medium" color={c.muted}>
                  {p}
                </AppText>
              </PressableScale>
            ))}
          </ScrollView>
          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={L('اسأل عن فكرة أو نصيحة تصوير', 'Ask for an idea or a filming tip')}
              placeholderTextColor={c.placeholder}
              style={[styles.input, { color: c.text, backgroundColor: c.card, borderColor: c.line, textAlign: rtl ? 'right' : 'left' }]}
              onSubmitEditing={() => send(text)}
              returnKeyType="send"
            />
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={L('أرسل', 'Send')}
              disabled={!text.trim() || busy}
              onPress={() => send(text)}
              style={[styles.send, { backgroundColor: text.trim() ? c.primary : c.tile }]}>
              <Icon name="send" color={text.trim() ? c.onPrimary : c.placeholder} size={18} strokeWidth={1.8} />
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  thread: { padding: 20, gap: 12 },
  block: { gap: 8 },
  bubble: { maxWidth: '86%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.tier },
  ideaHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  choose: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  me: { alignSelf: 'flex-end', borderBottomEndRadius: 4 },
  ai: { alignSelf: 'flex-start', borderBottomStartRadius: 4 },
  typing: { paddingVertical: 6 },
  why: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shot: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2 },
  num: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  composer: { borderTopWidth: 1, paddingTop: 10, gap: 8 },
  prompts: { gap: 8, paddingHorizontal: 16 },
  prompt: { height: 36, paddingHorizontal: 14, borderRadius: radius.chip, borderWidth: 1, justifyContent: 'center' },
  inputRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  input: { flex: 1, height: 46, borderRadius: radius.control, borderWidth: 1, paddingHorizontal: 14, fontFamily: 'ReadexPro_400Regular', fontSize: 14 },
  send: { width: 46, height: 46, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
});
