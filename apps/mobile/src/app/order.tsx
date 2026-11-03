import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View, type ScrollViewInstance, type TextInputInstance } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  formatIQD,
  formatUsd,
  radius,
  serviceTiers,
  serviceTools,
  services,
  tierNames,
  tierQuality,
  type Quote,
  type ServiceKind,
  type ServiceParams,
  type ServiceTier,
} from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { Badge, Card, Divider, KeyValue, Note, TopBar, ui } from '@/components/ui';
import { useI18n } from '@/i18n';
import { aiErrorText, postJson, useAiStatus, useBusiness } from '@/lib/ai';
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

const openers: Record<ServiceKind, { ar: string; en: string }> = {
  editVideo: { ar: 'أريد مونتاج فيديو لدي', en: 'I want a video of mine edited' },
  adImage: { ar: 'أريد إعلانًا من صورة منتجي', en: 'I want an ad from my product photo' },
  textVideo: { ar: 'أريد فيديو من وصف دون تصوير', en: 'I want a video from a description, no filming' },
  copy: { ar: 'أريد نص منشور أو إعلان', en: 'I want copy for a post or an ad' },
  voice: { ar: 'أريد تعليقًا صوتيًا لنص', en: 'I want a voice-over for a text' },
};

// The order desk: the customer explains what they want, attaches their own
// video or photo if the service needs one, picks a level, and sees every
// model, its cost and the total before anything runs.
export default function OrderScreen() {
  const { c } = useTheme();
  const { L, pick, lang, rtl } = useI18n();
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
      text: L(
        'أهلًا بك. أخبرني بما تريد: مونتاج فيديو لديك، أو إعلان من صورة، أو فيديو من وصف، أو نص، أو تعليق صوتي. وإذا كان لديك فيديو أو صورة، فأرفقها من زر الإرفاق.',
        'Hello. Tell me what you need: editing a video of yours, an ad from a photo, a video from a description, copy, or a voice-over. If you have a video or photo, attach it with the + button.',
      ),
    },
  ]);
  const [text, setText] = useState(service && openers[service] ? pick(openers[service]) : '');
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [tier, setTier] = useState<ServiceTier>('mid');
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
      setNote(
        picked.error === 'permission'
          ? L('نحتاج إلى إذن الوصول إلى الصور لتختار الملف.', 'We need access to your photos to pick the file.')
          : L('الفيديو أطول من 3 دقائق. قصّه أو اختر فيديو أقصر.', 'The video is longer than 3 minutes. Trim it or choose a shorter one.'),
      );
      return;
    }
    setMedia(picked);
    setNote(null);
  };

  const send = async () => {
    const body = text.trim() || (media ? (media.kind === 'video' ? L('أرفقت الفيديو', 'I attached the video') : L('أرفقت الصورة', 'I attached the photo')) : '');
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
      if (r.ready && r.params) setPlan({ title: r.title || pick(services[r.params.kind].name), params: r.params });
    } catch (err) {
      setNote(aiErrorText(err, lang));
    } finally {
      setBusy(false);
    }
  };

  const orderMedia = [...turns].reverse().find((t) => t.media)?.media ?? null;
  const needs = plan ? services[plan.params.kind].needs : null;
  const missingMedia = Boolean(needs && (!orderMedia || orderMedia.kind !== needs));
  const quotes: Record<ServiceTier, Quote> | null = plan
    ? { low: priceFor(plan.params, orderMedia?.seconds ?? 0, 'low'), mid: priceFor(plan.params, orderMedia?.seconds ?? 0, 'mid'), high: priceFor(plan.params, orderMedia?.seconds ?? 0, 'high') }
    : null;
  const q = quotes?.[tier] ?? null;

  const approve = () => {
    if (!plan || !q || missingMedia) return;
    const { id, at } = newOrderId();
    addJob({
      id,
      kind: plan.params.kind,
      title: plan.title,
      params: plan.params,
      tier,
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
        title={L('اطلب خدمة', 'Order a service')}
        subtitle={L('دون اشتراك، تدفع ثمن الطلب فقط', 'No subscription, pay per order')}
        mode="close"
        right={
          status === 'online' ? (
            <Badge label={L('متصل', 'Online')} tone="ok" />
          ) : status === 'locked' ? (
            <Badge label={L('يحتاج إلى رمز', 'Needs code')} tone="acc" />
          ) : status === 'offline' ? (
            <Badge label={L('غير متصل', 'Offline')} />
          ) : undefined
        }
      />
      <KeyboardAvoidingView style={ui.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={styles.thread} keyboardShouldPersistTaps="handled">
          {turns.map((t) => (
            <Animated.View key={t.id} entering={reduceMotion ? undefined : FadeIn.duration(200)} style={[styles.msg, t.from === 'me' ? styles.mine : styles.theirs]}>
              {t.media && (
                <View style={[styles.attachment, { backgroundColor: c.priSoft }]}>
                  <Icon name={t.media.kind === 'video' ? 'video' : 'camera'} color={c.onPriSoft} size={15} />
                  <AppText size={12} color={c.onPriSoft} numberOfLines={1} style={ui.flex}>
                    {t.media.kind === 'video' ? L(`فيديو · ${Math.round(t.media.seconds)} ث`, `Video · ${Math.round(t.media.seconds)}s`) : L('صورة', 'Photo')}
                  </AppText>
                </View>
              )}
              <View style={[styles.bubble, t.from === 'me' ? { backgroundColor: c.primary, borderBottomEndRadius: 4 } : { backgroundColor: c.tile, borderBottomStartRadius: 4 }]}>
                <AppText size={14} lineHeight={22} color={t.from === 'me' ? c.onPrimary : c.text}>
                  {t.text}
                </AppText>
              </View>
            </Animated.View>
          ))}
          {busy && (
            <View style={[styles.bubble, styles.theirs, { backgroundColor: c.tile }]}>
              <AppText size={13} color={c.muted}>
                {L('يدرس طلبك…', 'Reading your request…')}
              </AppText>
            </View>
          )}

          {plan && q && quotes && (
            <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(260)}>
              <Card>
                <View style={ui.between}>
                  <View style={ui.flex}>
                    <AppText size={12} color={c.muted}>
                      {pick(services[plan.params.kind].name)}
                    </AppText>
                    <AppText weight="semibold" size={16}>
                      {plan.title}
                    </AppText>
                  </View>
                  <Badge label={L('عرض سعر', 'Quote')} tone="pri" icon="receipt" />
                </View>
                <Divider />

                <AppText weight="medium" size={13} color={c.muted}>
                  {L('اختر المستوى', 'Choose a level')}
                </AppText>
                <View accessibilityRole="radiogroup" style={styles.tiers}>
                  {serviceTiers.map((tr) => {
                    const active = tr === tier;
                    return (
                      <PressableScale
                        key={tr}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                        accessibilityLabel={`${pick(tierNames[tr])}، ${formatIQD(quotes[tr].totalIqd)}`}
                        onPress={() => setTier(tr)}
                        style={[styles.tier, { backgroundColor: active ? c.priSoft : c.tile, borderColor: active ? c.primary : c.line, borderWidth: active ? 1.5 : 1 }]}>
                        <AppText weight="semibold" size={13.5} color={active ? c.onPriSoft : c.text} center>
                          {pick(tierNames[tr])}
                        </AppText>
                        <AppText size={12.5} weight="medium" color={active ? c.onPriSoft : c.muted} style={ui.tabular} center>
                          {formatIQD(quotes[tr].totalIqd)}
                        </AppText>
                      </PressableScale>
                    );
                  })}
                </View>
                <View style={[styles.quality, { backgroundColor: c.tile }]}>
                  <Icon name="sparkle" color={c.primary} size={16} />
                  <View style={ui.flex}>
                    <AppText weight="medium" size={13}>
                      {pick(tierQuality[plan.params.kind][tier])}
                    </AppText>
                    <AppText size={11.5} color={c.muted} lineHeight={17}>
                      {L(
                        'يختلف كل مستوى في نماذج الذكاء الاصطناعي المستخدمة، فتختلف الجودة والسعر.',
                        'Each level uses different AI models, so quality and price differ.',
                      )}
                    </AppText>
                  </View>
                </View>

                <AppText weight="medium" size={13} color={c.muted}>
                  {L('النماذج والأدوات المستخدمة في هذا المستوى', 'Models and tools at this level')}
                </AppText>
                {q.lines.map((l, i) => {
                  const tool = serviceTools[l.tool];
                  return (
                    <View key={`${l.tool}${i}`} style={styles.line}>
                      <View style={ui.flex}>
                        <AppText weight="medium" size={14}>
                          {tool.name}
                          <AppText size={12} color={c.muted}>
                            {` · ${tool.vendor}`}
                          </AppText>
                        </AppText>
                        <AppText size={12} color={c.muted}>
                          {pick(l.task)}
                        </AppText>
                        <AppText size={11.5} color={c.placeholder}>
                          {L(
                            `الكمية ${l.qty} ${tool.unit.ar} · \u2066${formatUsd(l.unitUsd)}\u2069 لكل ${tool.unit.ar}`,
                            `${l.qty} × ${tool.unit.en} at ${formatUsd(l.unitUsd)} each`,
                          )}
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
                  );
                })}
                <Divider />
                <KeyValue label={L('تكلفة الأدوات', 'Tools cost')} value={formatIQD(q.toolsIqd)} />
                <KeyValue
                  label={L('رسوم الخدمة', 'Service fee')}
                  sub={L('التجهيز والمراجعة والتخزين والدعم', 'Setup, review, storage and support')}
                  value={formatIQD(q.feeIqd)}
                />
                <Divider />
                <KeyValue label={L('المجموع', 'Total')} value={formatIQD(q.totalIqd)} strong />
                {missingMedia && (
                  <Note tone="acc" icon="alert">
                    {needs === 'video'
                      ? L('أرفق الفيديو الذي تريد مونتاجه قبل الموافقة.', 'Attach the video to edit before approving.')
                      : L('أرفق صورة المنتج قبل الموافقة.', 'Attach the product photo before approving.')}
                  </Note>
                )}
                <View style={styles.approveRow}>
                  <Button label={L('عدّل الطلب', 'Edit')} variant="secondary" height={46} style={ui.flex} onPress={() => input.current?.focus()} />
                  <Button label={L('وافق ونفّذ', 'Approve & run')} icon="check" height={46} style={styles.approve} disabled={missingMedia} onPress={approve} />
                </View>
                <AppText size={11.5} color={c.placeholder} center>
                  {L(
                    'نسخة تجريبية: يُفعَّل الدفع مع الخادم، ويُنفَّذ الطلب حاليًا على حساب صاحب التطبيق.',
                    'Test build: payment arrives with the server; orders now run on the app owner\'s account.',
                  )}
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
              <Button label={L('فيديو من المعرض', 'Video from gallery')} icon="video" variant="secondary" height={40} style={ui.flex} onPress={() => attach('video')} />
              <Button label={L('صورة', 'Photo')} icon="camera" variant="secondary" height={40} style={ui.flex} onPress={() => attach('image')} />
            </View>
          )}
          {media && (
            <View style={[styles.pending, { backgroundColor: c.priSoft }]}>
              <Icon name={media.kind === 'video' ? 'video' : 'camera'} color={c.onPriSoft} size={15} />
              <AppText size={12.5} color={c.onPriSoft} style={ui.flex} numberOfLines={1}>
                {media.kind === 'video'
                  ? L(`فيديو جاهز للإرسال · ${Math.round(media.seconds)} ث`, `Video ready to send · ${Math.round(media.seconds)}s`)
                  : L('صورة جاهزة للإرسال', 'Photo ready to send')}
              </AppText>
              <PressableScale accessibilityRole="button" accessibilityLabel={L('إزالة المرفق', 'Remove attachment')} onPress={() => setMedia(null)} style={styles.remove}>
                <Icon name="close" color={c.onPriSoft} size={15} />
              </PressableScale>
            </View>
          )}
          <View style={styles.inputRow}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={L('إرفاق فيديو أو صورة', 'Attach a video or photo')}
              onPress={() => setAttachOpen((o) => !o)}
              style={[styles.iconBtn, { backgroundColor: c.tile }]}>
              <Icon name="plus" color={c.text} size={20} />
            </PressableScale>
            <TextInput
              ref={input}
              value={text}
              onChangeText={setText}
              placeholder={L('اكتب طلبك', 'Describe your request')}
              placeholderTextColor={c.placeholder}
              multiline
              style={[styles.input, { color: c.text, backgroundColor: c.tile, textAlign: rtl ? 'right' : 'left' }]}
            />
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={L('أرسل', 'Send')}
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
  tiers: { flexDirection: 'row', gap: 8 },
  tier: { flex: 1, borderRadius: radius.control, paddingVertical: 10, paddingHorizontal: 6, gap: 2, minHeight: 58, justifyContent: 'center' },
  quality: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: radius.control, padding: 10 },
  approveRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  approve: { flex: 1.4 },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, paddingHorizontal: 12, gap: 8 },
  attachRow: { flexDirection: 'row', gap: 8 },
  pending: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 10, minHeight: 38 },
  remove: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: radius.control, paddingHorizontal: 14, paddingVertical: 10, fontFamily: 'ReadexPro_400Regular', fontSize: 14 },
  iconBtn: { width: 44, height: 44, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
});
