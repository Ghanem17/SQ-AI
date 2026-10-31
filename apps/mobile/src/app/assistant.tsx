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
import { todayShots } from '@/mock/data';
import { useSession } from '@/state/session';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

type Idea = { title: string; hook: string; why: string };

type Entry =
  | { id: number; from: 'me'; text: string }
  | { id: number; from: 'ai'; text: string }
  | { id: number; from: 'ai'; kind: 'ideas'; ideas: Idea[] }
  | { id: number; from: 'ai'; kind: 'shots'; idea: Idea };

const shopIdeas: Idea[] = [
  { title: 'صحن الدولمة من المطبخ للطاولة', hook: '«دولمة اليوم طالعة قبل ساعة»', why: 'ريلز الأكل الطازج جابتلك أرخص طلبات الشهر' },
  { title: 'عرض الغداء العائلي للجمعة', hook: '«غداء لـ 6 أشخاص بـ 45 ألف»', why: 'طلبات الجمعة أعلى بـ 60% من باقي الأيام' },
  { title: 'خلف الكواليس: تتبيل الكباب', hook: '«سر الكباب عندنا؟ هذا هو»', why: 'فيديوهات التحضير تحصل على حفظ ومشاركة أكثر' },
];

const creatorIdeas: Idea[] = [
  { title: 'جرّب 3 مطاعم بـ 20 ألف', hook: '«بـ 20 ألف، وين أطيب عشا ببغداد؟»', why: 'أفضل فيديو عندك هذا الشهر من نفس النوع' },
  { title: 'فطور الجمعة بأقل من 10 آلاف', hook: '«فطور كامل بـ 9 آلاف، يستاهل؟»', why: 'البحث عن «فطور بغداد» ارتفع هذا الأسبوع' },
  { title: 'الأغلى ضد الأرخص', hook: '«الفرق بين 5 آلاف و50 ألف»', why: 'المقارنات تحصل على مشاركات أكثر بمرتين' },
];

const tips =
  'ثلاث قواعد تفرق كثيرًا:\n1. صوّر قرب شباك، والضوء يجي من الجنب مو من الخلف.\n2. ثبّت الموبايل بيدين أو على كوب، وتحرك ببطء.\n3. أول ثانيتين أهم شي: ابدأ بأقرب لقطة وأشهى منظر.';

// The assistant for "I don't know what to film": quick prompts, ideas tied to
// the account's own numbers, and a shot list that opens the camera.
export default function AssistantScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { accountType } = useSession();
  const { startDraft } = useStudio();
  const ideas = accountType === 'creator' ? creatorIdeas : shopIdeas;
  const [entries, setEntries] = useState<Entry[]>([
    { id: 0, from: 'ai', text: 'أهلًا، أنا مساعد SQ. أقترح عليك ماذا تصوّر حسب خطة شهرك وأداء الريلز السابقة، وأحوّل الفكرة لقائمة لقطات جاهزة.' },
  ]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const nextId = useRef(1);

  useEffect(() => {
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: !reduceMotion }), 50);
    return () => clearTimeout(t);
  }, [entries, typing, reduceMotion]);

  const reply = (make: () => Entry) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setEntries((e) => [...e, make()]);
    }, 900);
  };

  const ask = (q: string) => {
    const body = q.trim();
    if (!body || typing) return;
    setEntries((e) => [...e, { id: nextId.current++, from: 'me', text: body }]);
    setText('');
    const id = nextId.current++;
    if (/كيف|نصيح|ضو|إضاء|اضاء/.test(body)) reply(() => ({ id, from: 'ai', text: tips }));
    else reply(() => ({ id, from: 'ai', kind: 'ideas', ideas }));
  };

  const choose = (idea: Idea) => {
    setEntries((e) => [...e, { id: nextId.current++, from: 'me', text: `خلينا نصوّر: ${idea.title}` }]);
    const id = nextId.current++;
    reply(() => ({ id, from: 'ai', kind: 'shots', idea }));
  };

  const prompts = ['شو أصوّر اليوم؟', 'فكرة لعرض نهاية الأسبوع', 'كيف أصوّر الأكل بشكل أحلى؟'];

  return (
    <Screen edges={['top']}>
      <TopBar title="المساعد" subtitle="أفكار وقوائم لقطات" mode="close" />
      <KeyboardAvoidingView style={ui.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={styles.thread} keyboardShouldPersistTaps="handled">
          {entries.map((e) => (
            <Animated.View key={e.id} entering={reduceMotion ? undefined : FadeIn.duration(220)}>
              {e.from === 'me' ? (
                <View style={[styles.bubble, styles.me, { backgroundColor: c.primary }]}>
                  <AppText size={14} lineHeight={22} color={c.onPrimary}>
                    {e.text}
                  </AppText>
                </View>
              ) : 'kind' in e && e.kind === 'ideas' ? (
                <View style={styles.block}>
                  <AppText size={14} lineHeight={22}>
                    هذه ثلاث أفكار مناسبة لك هذا الأسبوع:
                  </AppText>
                  {e.ideas.map((idea) => (
                    <Card key={idea.title} onPress={() => choose(idea)} accessibilityLabel={idea.title}>
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
                </View>
              ) : 'kind' in e && e.kind === 'shots' ? (
                <View style={styles.block}>
                  <AppText size={14} lineHeight={22}>
                    ممتاز. هذه قائمة اللقطات، كل لقطة بين 3 و4 ثوانٍ:
                  </AppText>
                  <Card>
                    <AppText weight="semibold" size={14.5}>
                      {e.idea.title}
                    </AppText>
                    {todayShots.map((s, i) => (
                      <View key={s.title} style={styles.shot}>
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
                        startDraft(e.idea.title);
                        router.dismissTo('/(tabs)/camera');
                      }}
                    />
                  </Card>
                </View>
              ) : (
                <View style={[styles.bubble, styles.ai, { backgroundColor: c.tile }]}>
                  <AppText size={14} lineHeight={22}>
                    {'text' in e ? e.text : ''}
                  </AppText>
                </View>
              )}
            </Animated.View>
          ))}
          {typing && (
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
              <PressableScale key={p} accessibilityRole="button" onPress={() => ask(p)} style={[styles.prompt, { borderColor: c.line }]}>
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
              onSubmitEditing={() => ask(text)}
              returnKeyType="send"
            />
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="أرسل"
              disabled={!text.trim() || typing}
              onPress={() => ask(text)}
              style={[styles.send, { backgroundColor: text.trim() ? c.primary : c.tile }]}>
              <Icon name="send" color={text.trim() ? c.onPrimary : c.placeholder} size={18} />
            </PressableScale>
          </View>
          <AppText size={11} color={c.placeholder} center>
            نسخة تجريبية · الردود جاهزة مسبقًا حتى ربط Claude في المرحلة الثانية
          </AppText>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  thread: { padding: 16, gap: 12 },
  bubble: { maxWidth: '86%', paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.tile },
  me: { alignSelf: 'flex-end', borderBottomLeftRadius: 4 },
  ai: { alignSelf: 'flex-start', borderBottomRightRadius: 4 },
  typing: { paddingVertical: 6 },
  block: { gap: 8 },
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
