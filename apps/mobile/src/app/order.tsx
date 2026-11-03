import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View, type ScrollViewInstance, type TextInputInstance } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatIQD, formatUsd, radius, serviceTools, services, type Quote, type ServiceKind, type ServiceParams } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { Badge, Card, Divider, KeyValue, Note, TopBar, ui } from '@/components/ui';
import { AiUnavailable, postJson, unavailableText, useAiStatus, useBusiness } from '@/lib/ai';
import { pickMedia, type PickedMedia } from '@/features/services/media';
import { useServices } from '@/features/services/store';
import { useTheme } from '@/theme/theme';

type Turn = { id: number; from: 'me' | 'ai'; text: string; media?: PickedMedia };
type Plan = { title: string; params: ServiceParams };

// Order ids and times come from the clock when the customer approves.
function newOrderId() {
  const at = Date.now();
  return { id: `S-${at.toString(36).toUpperCase()}`, at };
}

const openers: Record<ServiceKind, string> = {
  editVideo: 'بدي مونتاج لفيديو عندي',
  adImage: 'بدي إعلان من صورة منتجي',
  textVideo: 'بدي فيديو من وصف بدون تصوير',
  copy: 'بدي نص بوست أو إعلان',
  voice: 'بدي تعليق صوتي لنص',
};

// The order desk: the customer explains what they want, attaches their own
// video or photo if the service needs one, and sees every tool, its cost and
// the total before anything runs.
export default function OrderScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { service } = useLocalSearchParams<{ service?: ServiceKind }>();
  const business = useBusiness();
  const status = useAiStatus();
  const { priceFor, addJob } = useServices();

  const [turns, setTurns] = useState<Turn[]>([
    {
      id: 0,
      from: 'ai',
      text: 'أهلًا، احكيلي شو بدك: مونتاج فيديو عندك، إعلان من صورة، فيديو من وصف، نص، أو تعليق صوتي. وإذا عندك فيديو أو صورة، أرفقها من زر الإرفاق.',
    },
  ]);
  const [text, setText] = useState(service && openers[service] ? openers[service] : '');
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const scroll = useRef<ScrollViewInstance>(null);
  const nextId = useRef(1);
  const input = useRef<TextInputInstance>(null);

  useEffect(() => {
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: !reduceMotion }), 60);
    return () => clearTimeout(t);
  }, [turns, plan, busy, reduceMotion]);

  const attach = async (kind: 'video' | 'image') => {
    setAttachOpen(false);
    const picked = await pickMedia(kind);
    if (!picked) return;
    if ('error' in picked) {
      setNote(picked.error);
      return;
    }
    setMedia(picked);
    setNote(null);
  };

  const send = async () => {
    const body = text.trim() || (media ? (media.kind === 'video' ? 'أرفقت الفيديو' : 'أرفقت الصورة') : '');
    if (!body || busy) return;
    const mine: Turn = { id: nextId.current++, from: 'me', text: body, media: media ?? undefined };
    const history = [...turns, mine];
    setTurns(history);
    setText('');
    setMedia(null);
    setPlan(null);
    setBusy(true);
    setNote(null);
    const lastMedia = [...history].reverse().find((t) => t.media)?.media ?? null;
    try {
      const r = await postJson<{ reply: string; ready: boolean; title: string; params: ServiceParams | null }>(
        '/api/plan',
        {
          business,
          media: lastMedia ? { kind: lastMedia.kind, seconds: lastMedia.seconds } : null,
          messages: history.slice(1).map((t) => ({ role: t.from === 'me' ? 'user' : 'assistant', content: t.text })),
        },
        90000,
      );
      setTurns((t) => [...t, { id: nextId.current++, from: 'ai', text: r.reply }]);
      if (r.ready && r.params) setPlan({ title: r.title || services[r.params.kind].name, params: r.params });
    } catch (err) {
      setNote(err instanceof AiUnavailable ? unavailableText[err.reason] : unavailableText.failed);
    } finally {
      setBusy(false);
    }
  };

  const orderMedia = [...turns].reverse().find((t) => t.media)?.media ?? null;
  const needs = plan ? services[plan.params.kind].needs : null;
  const missingMedia = Boolean(needs && (!orderMedia || orderMedia.kind !== needs));
  const q: Quote | null = plan ? priceFor(plan.params, orderMedia?.seconds ?? 0) : null;

  const approve = () => {
    if (!plan || !q || missingMedia) return;
    const { id, at } = newOrderId();
    addJob({
      id,
      kind: plan.params.kind,
      title: plan.title,
      params: plan.params,
      media: needs && orderMedia ? orderMedia : null,
      quote: q,
      status: 'pending',
      step: '',
      progress: 0,
      createdAt: at,
    });
    router.replace({ pathname: '/job/[id]', params: { id } });
  };

  return (
    <Screen edges={['top']}>
      <TopBar
        title="اطلب خدمة"
        subtitle="بدون اشتراك، تدفع حق الطلب بس"
        mode="close"
        right={status === 'online' ? <Badge label="متصل" tone="ok" /> : status === 'locked' ? <Badge label="يحتاج رمز" tone="acc" /> : status === 'offline' ? <Badge label="غير متصل" /> : undefined}
      />
      <KeyboardAvoidingView style={ui.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={styles.thread} keyboardShouldPersistTaps="handled">
          {turns.map((t) => (
            <Animated.View key={t.id} entering={reduceMotion ? undefined : FadeIn.duration(200)} style={[styles.msg, t.from === 'me' ? styles.mine : styles.theirs]}>
              {t.media && (
                <View style={[styles.attachment, { backgroundColor: c.priSoft }]}>
                  <Icon name={t.media.kind === 'video' ? 'video' : 'camera'} color={c.onPriSoft} size={15} />
                  <AppText size={12} color={c.onPriSoft} numberOfLines={1} style={ui.flex}>
                    {t.media.kind === 'video' ? `فيديو · ${Math.round(t.media.seconds)} ث` : 'صورة'}
                  </AppText>
                </View>
              )}
              <View style={[styles.bubble, t.from === 'me' ? { backgroundColor: c.primary, borderBottomLeftRadius: 4 } : { backgroundColor: c.tile, borderBottomRightRadius: 4 }]}>
                <AppText size={14} lineHeight={22} color={t.from === 'me' ? c.onPrimary : c.text}>
                  {t.text}
                </AppText>
              </View>
            </Animated.View>
          ))}
          {busy && (
            <View style={[styles.bubble, styles.theirs, { backgroundColor: c.tile }]}>
              <AppText size={13} color={c.muted}>
                يفكر بطلبك…
              </AppText>
            </View>
          )}

          {plan && q && (
            <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(260)}>
              <Card>
                <View style={ui.between}>
                  <View style={ui.flex}>
                    <AppText size={12} color={c.muted}>
                      {services[plan.params.kind].name}
                    </AppText>
                    <AppText weight="semibold" size={16}>
                      {plan.title}
                    </AppText>
                  </View>
                  <Badge label="عرض سعر" tone="pri" icon="receipt" />
                </View>
                <Divider />
                <AppText weight="medium" size={13} color={c.muted}>
                  الأدوات اللي رح نستخدمها
                </AppText>
                {q.lines.map((l, i) => (
                  <View key={`${l.tool}${i}`} style={styles.line}>
                    <View style={ui.flex}>
                      <AppText weight="medium" size={14}>
                        {serviceTools[l.tool].name}
                        <AppText size={12} color={c.muted}>
                          {` · ${serviceTools[l.tool].vendor}`}
                        </AppText>
                      </AppText>
                      <AppText size={12} color={c.muted}>
                        {l.task} · الكمية {l.qty} {serviceTools[l.tool].unit} · {`\u2066${formatUsd(l.unitUsd)}\u2069`} لكل {serviceTools[l.tool].unit}
                      </AppText>
                    </View>
                    <View style={styles.lineCost}>
                      <AppText size={13.5} weight="medium" style={ui.tabular}>
                        {formatIQD(l.costIqd)}
                      </AppText>
                      <AppText size={11} color={c.placeholder} style={ui.tabular}>
                        {formatUsd(l.costUsd)}
                      </AppText>
                    </View>
                  </View>
                ))}
                <Divider />
                <KeyValue label="كلفة الأدوات" value={formatIQD(q.toolsIqd)} />
                <KeyValue label="رسوم الخدمة" sub="التجهيز، المراجعة، التخزين والدعم" value={formatIQD(q.feeIqd)} />
                <Divider />
                <KeyValue label="المجموع" value={formatIQD(q.totalIqd)} strong />
                {missingMedia && (
                  <Note tone="acc" icon="alert">
                    {needs === 'video' ? 'أرفق الفيديو اللي بدك نمنتجه قبل الموافقة.' : 'أرفق صورة المنتج قبل الموافقة.'}
                  </Note>
                )}
                <View style={styles.approveRow}>
                  <Button label="عدّل الطلب" variant="secondary" height={46} style={ui.flex} onPress={() => input.current?.focus()} />
                  <Button label="وافق ونفّذ" icon="check" height={46} style={styles.approve} disabled={missingMedia} onPress={approve} />
                </View>
                <AppText size={11.5} color={c.placeholder} center>
                  نسخة تجريبية: الدفع يُفعَّل مع السيرفر، والتنفيذ الآن على حساب صاحب التطبيق.
                </AppText>
              </Card>
            </Animated.View>
          )}
          {note && (
            <Note tone="bad" icon="alert">
              {note}
            </Note>
          )}
        </ScrollView>

        <View style={[styles.composer, { borderTopColor: c.line, backgroundColor: c.bg, paddingBottom: insets.bottom + 8 }]}>
          {attachOpen && (
            <View style={styles.attachRow}>
              <Button label="فيديو من الاستوديو" icon="video" variant="secondary" height={40} style={ui.flex} onPress={() => attach('video')} />
              <Button label="صورة" icon="camera" variant="secondary" height={40} style={ui.flex} onPress={() => attach('image')} />
            </View>
          )}
          {media && (
            <View style={[styles.pending, { backgroundColor: c.priSoft }]}>
              <Icon name={media.kind === 'video' ? 'video' : 'camera'} color={c.onPriSoft} size={15} />
              <AppText size={12.5} color={c.onPriSoft} style={ui.flex} numberOfLines={1}>
                {media.kind === 'video' ? `فيديو جاهز للإرسال · ${Math.round(media.seconds)} ث` : 'صورة جاهزة للإرسال'}
              </AppText>
              <PressableScale accessibilityRole="button" accessibilityLabel="إزالة المرفق" onPress={() => setMedia(null)} style={styles.remove}>
                <Icon name="close" color={c.onPriSoft} size={15} />
              </PressableScale>
            </View>
          )}
          <View style={styles.inputRow}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="إرفاق فيديو أو صورة"
              onPress={() => setAttachOpen((o) => !o)}
              style={[styles.iconBtn, { backgroundColor: c.tile }]}>
              <Icon name="plus" color={c.text} size={20} />
            </PressableScale>
            <TextInput
              ref={input}
              value={text}
              onChangeText={setText}
              placeholder="اكتب طلبك"
              placeholderTextColor={c.placeholder}
              multiline
              style={[styles.input, { color: c.text, backgroundColor: c.tile }]}
            />
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="أرسل"
              disabled={(!text.trim() && !media) || busy}
              onPress={send}
              style={[styles.iconBtn, { backgroundColor: text.trim() || media ? c.primary : c.tile }]}>
              <Icon name="send" color={text.trim() || media ? c.onPrimary : c.placeholder} size={18} />
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  thread: { padding: 16, gap: 12 },
  msg: { maxWidth: '86%', gap: 4 },
  mine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.tile },
  attachment: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, minWidth: 140 },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 3 },
  lineCost: { alignItems: 'flex-end' },
  approveRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  approve: { flex: 1.4 },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, paddingHorizontal: 12, gap: 8 },
  attachRow: { flexDirection: 'row', gap: 8 },
  pending: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 10, minHeight: 38 },
  remove: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: radius.control, paddingHorizontal: 14, paddingVertical: 10, fontFamily: 'ReadexPro_400Regular', fontSize: 14, textAlign: 'right' },
  iconBtn: { width: 44, height: 44, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
});
