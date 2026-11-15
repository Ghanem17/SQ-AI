import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View, type ScrollViewInstance, type TextInputInstance } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  MAX_REFERENCE_IMAGES,
  font,
  formatIQD,
  radius,
  serviceOrder,
  serviceTiers,
  services,
  tierModel,
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
import { Badge, Card, Footer, GUTTER, IconBadge, IconButton, ModelChip, Note, RadioCard, SectionTitle, TopBar, ui } from '@/components/ui';
import { ExampleStrip } from '@/features/services/examples';
import { WhyPrice } from '@/features/services/WhyPrice';
import { QuickForm, initialQuick, quickMessage, quickReady, type QuickState } from '@/features/services/QuickForm';
import { useI18n } from '@/i18n';
import { AiUnavailable, aiErrorText, postJson, useAiStatus, useBusiness } from '@/lib/ai';
import { pickMedia, pickPhotos, type PickedMedia } from '@/features/services/media';
import { serviceIcons } from '@/features/services/OrderRow';
import { useServices } from '@/features/services/store';
import { useTheme } from '@/theme/theme';

type Turn = { id: number; from: 'me' | 'ai'; text: string; media?: PickedMedia[] };
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
  imageVideo: { ar: 'أريد فيديو من صور منتجي', en: 'I want a video made from my product photos' },
  copy: { ar: 'أريد نص منشور أو إعلان', en: 'I want copy for a post or an ad' },
  voice: { ar: 'أريد تعليقًا صوتيًا لنص', en: 'I want a voice-over for a text' },
};

// The brief the assistant understood, in the customer's words where possible.
// Video and image prompts are written in English for the models, so the
// customer sees their own request instead.
function brief(params: ServiceParams, L: (a: string, e: string) => string, customerText: string): string {
  switch (params.kind) {
    case 'textVideo':
    case 'imageVideo':
    case 'adImage':
      return customerText || params.prompt;
    case 'voice':
      return params.text;
    case 'copy':
      return params.details ? `${params.topic}. ${params.details}` : params.topic;
    case 'editVideo': {
      const parts = [
        params.trimStart !== null || params.trimEnd !== null ? L('قص الفيديو', 'Trim the video') : null,
        params.captions ? L('كتابة الكلام على الفيديو', 'Add captions') : null,
        params.music ? L(`موسيقى: ${params.music}`, `Music: ${params.music}`) : null,
      ].filter(Boolean);
      return parts.length ? parts.join(' · ') : L('مونتاج الفيديو المرفق', 'Edit the attached video');
    }
  }
}

// The order desk: the customer fills a quick form for the chosen service (or
// explains in a chat), attaches their own video or photos if the service
// needs them, then picks a level and sees the cost before anything runs.
export default function OrderScreen() {
  const { c } = useTheme();
  const i18n = useI18n();
  const { L, pick, lang, rtl, n } = i18n;
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const params = useLocalSearchParams<{ service?: string }>();
  // A service chosen on the services tab opens its quick form; otherwise the
  // customer starts by chatting with the assistant.
  const service = serviceOrder.find((k) => k === params.service) ?? null;
  const business = useBusiness();
  const status = useAiStatus();
  const { priceFor, addJob } = useServices();

  const [turns, setTurns] = useState<Turn[]>([
    {
      id: 0,
      from: 'ai',
      text: L(
        'أهلًا بك. أخبرني بما تريد: مونتاج فيديو لديك، أو فيديو من صورك، أو إعلان من صورة، أو فيديو من وصف، أو نص، أو تعليق صوتي. يمكنك إرفاق فيديو أو حتى أربع صور من زر الإرفاق.',
        'Hello. Tell me what you need: editing a video of yours, a video from your photos, an ad from a photo, a video from a description, copy, or a voice-over. Attach a video or up to four photos with the + button.',
      ),
    },
  ]);
  const [text, setText] = useState(service ? pick(openers[service]) : '');
  const [quick, setQuick] = useState<QuickState>(initialQuick);
  // Attachments waiting to be sent: one video, or up to four photos.
  const [media, setMedia] = useState<PickedMedia[]>([]);
  const [attachOpen, setAttachOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  // The quote opens on its own page once the assistant has a plan; `origin`
  // is the page it returns to.
  const [view, setView] = useState<'form' | 'chat' | 'quote'>(service ? 'form' : 'chat');
  const [origin, setOrigin] = useState<'form' | 'chat'>(service ? 'form' : 'chat');
  const [showWhy, setShowWhy] = useState(false);
  const [tier, setTier] = useState<ServiceTier>('mid');
  const [showLevels, setShowLevels] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  // Set when the last request failed, so the badge stops saying online.
  const [failed, setFailed] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const nextId = useRef(1);
  const input = useRef<TextInputInstance>(null);

  useEffect(() => {
    if (view !== 'chat') return;
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: !reduceMotion }), 60);
    return () => clearTimeout(t);
  }, [turns, plan, busy, reduceMotion, view]);

  const attach = async (kind: 'video' | 'image') => {
    setAttachOpen(false);
    const permissionNote = L('نحتاج إلى إذن الوصول إلى الصور لتختار الملف.', 'We need access to your photos to pick the file.');
    if (kind === 'image') {
      const kept = media.filter((m) => m.kind === 'image');
      const room = MAX_REFERENCE_IMAGES - kept.length;
      if (room <= 0) {
        setNote(L(`يمكنك إرفاق ${n(MAX_REFERENCE_IMAGES, 'photo')} كحد أقصى.`, `You can attach up to ${n(MAX_REFERENCE_IMAGES, 'photo')}.`));
        return;
      }
      const photos = await pickPhotos(room);
      if (!photos) return;
      if ('error' in photos) {
        setNote(permissionNote);
        return;
      }
      setMedia([...kept, ...photos].slice(0, MAX_REFERENCE_IMAGES));
      setNote(null);
      return;
    }
    const picked = await pickMedia('video');
    if (!picked) return;
    if ('error' in picked) {
      setNote(
        picked.error === 'permission'
          ? permissionNote
          : L('الفيديو أطول من 3 دقائق. قصّه أو اختر فيديو أقصر.', 'The video is longer than 3 minutes. Trim it or choose a shorter one.'),
      );
      return;
    }
    setMedia([picked]);
    setNote(null);
  };

  // Sends the conversation to the assistant. A plan opens the quote; a
  // question from the assistant shows in the chat.
  const ask = async (history: Turn[], from: 'form' | 'chat') => {
    setTurns(history);
    setPlan(null);
    setBusy(true);
    setNote(null);
    const sent = history.flatMap((t) => t.media ?? []);
    const lastMedia = sent[sent.length - 1] ?? null;
    const photoCount = Math.min(MAX_REFERENCE_IMAGES, sent.filter((m) => m.kind === 'image').length);
    try {
      const r = await postJson<{ reply: string; ready: boolean; title: string; params: ServiceParams | null }>(
        '/api/plan',
        {
          business,
          service,
          media: lastMedia ? { kind: lastMedia.kind, seconds: lastMedia.seconds, count: lastMedia.kind === 'image' ? photoCount : 1 } : null,
          messages: history.slice(1).map((t) => ({ role: t.from === 'me' ? 'user' : 'assistant', content: t.text })),
        },
        90000,
      );
      setTurns((t) => [...t, { id: nextId.current++, from: 'ai', text: r.reply }]);
      setFailed(false);
      if (r.ready && r.params) {
        setPlan({ title: r.title || pick(services[r.params.kind].name), params: r.params });
        setOrigin(from);
        setShowWhy(false);
        setView('quote');
      } else if (from === 'form') {
        // The assistant needs one more detail: answer it in the chat.
        setView('chat');
      }
    } catch (err) {
      setFailed(!(err instanceof AiUnavailable && err.reason === 'access'));
      setNote(aiErrorText(err, lang, 'chat'));
    } finally {
      setBusy(false);
    }
  };

  const send = () => {
    const body =
      text.trim() ||
      (media.length
        ? media[0].kind === 'video'
          ? L('أرفقت الفيديو', 'I attached the video')
          : media.length > 1
            ? L('أرفقت الصور', 'I attached the photos')
            : L('أرفقت الصورة', 'I attached the photo')
        : '');
    if (!body || busy) return;
    const mine: Turn = { id: nextId.current++, from: 'me', text: body, media: media.length ? media : undefined };
    setText('');
    setMedia([]);
    ask([...turns, mine], 'chat');
  };

  // The quick form is the whole request, so it starts a fresh conversation
  // with one composed message.
  const submitQuick = () => {
    if (!service || busy || !quickReady(service, quick)) return;
    const mine: Turn = { id: nextId.current++, from: 'me', text: quickMessage(service, quick, i18n), media: quick.media.length ? quick.media : undefined };
    // If the assistant asks something, the chat opens ready for the answer.
    setText('');
    setMedia([]);
    ask([turns[0], mine], 'form');
  };

  const addQuick = async () => {
    if (!service) return;
    const permissionNote = L('نحتاج إلى إذن الوصول إلى الصور لتختار الملف.', 'We need access to your photos to pick the file.');
    if (service === 'editVideo') {
      const picked = await pickMedia('video');
      if (!picked) return;
      if ('error' in picked) {
        setNote(
          picked.error === 'permission'
            ? permissionNote
            : L('الفيديو أطول من 3 دقائق. قصّه أو اختر فيديو أقصر.', 'The video is longer than 3 minutes. Trim it or choose a shorter one.'),
        );
        return;
      }
      setQuick((q) => ({ ...q, media: [picked] }));
      setNote(null);
      return;
    }
    // An ad uses one photo, so a new pick replaces it.
    const max = service === 'imageVideo' ? MAX_REFERENCE_IMAGES : 1;
    const kept = service === 'imageVideo' ? quick.media.filter((m) => m.kind === 'image') : [];
    const room = max - kept.length;
    if (room <= 0) return;
    const photos = await pickPhotos(room);
    if (!photos) return;
    if ('error' in photos) {
      setNote(permissionNote);
      return;
    }
    setQuick((q) => ({ ...q, media: [...kept, ...photos].slice(0, max) }));
    setNote(null);
  };

  // What the order uses: the latest video, or the latest photos (up to four
  // for a video from photos, one for an ad).
  const attached = turns.flatMap((t) => t.media ?? []);
  const photos = attached.filter((m) => m.kind === 'image').slice(-MAX_REFERENCE_IMAGES);
  const lastVideo = [...attached].reverse().find((m) => m.kind === 'video') ?? null;
  const needs = plan ? services[plan.params.kind].needs : null;
  const fromPhotos = plan?.params.kind === 'imageVideo';
  const orderMedia = needs === 'video' ? lastVideo : needs === 'image' ? (fromPhotos ? (photos[0] ?? null) : (photos[photos.length - 1] ?? null)) : null;
  const missingMedia = Boolean(needs && !orderMedia);
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
      images: fromPhotos ? photos : undefined,
      quote: q,
      status: 'pending',
      step: '',
      progress: 0,
      createdAt: at,
    });
    router.replace({ pathname: '/job/[id]', params: { id } });
  };

  const videoLabel = (m: PickedMedia) =>
    m.estimated ? L(`فيديو · نحو ${Math.round(m.seconds)} ث (تقديري)`, `Video · ~${Math.round(m.seconds)}s (estimate)`) : L(`فيديو · ${Math.round(m.seconds)} ث`, `Video · ${Math.round(m.seconds)}s`);

  const editRequest = (openAttach = false) => {
    if (origin === 'form') {
      setView('form');
      return;
    }
    setView('chat');
    if (openAttach) setAttachOpen(true);
    setTimeout(() => input.current?.focus(), 120);
  };

  if (view === 'quote' && plan && q && quotes) {
    const kind = plan.params.kind;
    return (
      <Screen edges={['top']}>
        <TopBar
          title={pick(services[kind].name)}
          onBack={() => setView(origin)}
          right={<IconButton icon="info" label={L('ما الفرق بين المستويات؟', 'How do the levels differ?')} onPress={() => setShowLevels((s) => !s)} />}
        />
        <ScrollView contentContainerStyle={styles.quote} showsVerticalScrollIndicator={false}>
          <ExampleStrip kind={kind} />
          <Card style={styles.request}>
            <IconBadge icon={serviceIcons[kind]} tone="solid" size={36} />
            <View style={ui.flex}>
              <AppText variant="caption" color={c.muted}>
                {L('طلبك', 'Your request')}
              </AppText>
              <AppText weight="semibold" size={13.5} lineHeight={20}>
                {plan.title}
              </AppText>
              <AppText size={13} lineHeight={20} color={c.muted} numberOfLines={3}>
                {brief(
                  plan.params,
                  L,
                  // From the form, the customer's own words are its description.
                  origin === 'form'
                    ? quick.desc.trim() || pick(services[kind].pitch)
                    : turns
                        .filter((t) => t.from === 'me')
                        .map((t) => t.text)
                        .join(' · '),
                )}
              </AppText>
              {orderMedia && (
                <View style={styles.mediaRow}>
                  <Badge
                    tone="pri"
                    icon={orderMedia.kind === 'video' ? 'video' : 'image'}
                    label={
                      orderMedia.kind === 'video'
                        ? videoLabel(orderMedia)
                        : fromPhotos
                          ? L(photos.length === 2 ? 'صورتان مرفقتان' : `${n(photos.length, 'photo')} مرفقة`, `${n(photos.length, 'photo')} attached`)
                          : L('صورة مرفقة', 'Photo attached')
                    }
                  />
                </View>
              )}
            </View>
            <PressableScale accessibilityRole="button" accessibilityLabel={L('عدّل الطلب', 'Edit the request')} onPress={() => editRequest()} style={styles.edit}>
              <Icon name="edit" color={c.muted} size={16} />
            </PressableScale>
          </Card>

          <SectionTitle title={L('اختر المستوى', 'Choose a level')} />
          {showLevels && (
            <Note tone="info" icon="layers">
              {L(
                'يختلف كل مستوى في نماذج الذكاء الاصطناعي المستخدمة، فتختلف الجودة والسعر. ترى أدناه كل نموذج وتكلفته.',
                'Each level uses different AI models, so quality and price differ. Every model and its cost is listed below.',
              )}
            </Note>
          )}
          <View accessibilityRole="radiogroup" style={styles.tiers}>
            {serviceTiers.map((tr) => (
              <RadioCard key={tr} selected={tr === tier} onPress={() => setTier(tr)} label={`${pick(tierNames[tr])}، ${tierModel(kind, tr)}، ${formatIQD(quotes[tr].totalIqd)}`}>
                <View style={styles.tierHead}>
                  <View style={styles.tierName}>
                    <AppText variant="rowTitle">{pick(tierNames[tr])}</AppText>
                    <ModelChip label={tierModel(kind, tr)} />
                  </View>
                  <AppText weight="bold" size={15} lineHeight={22}>
                    {formatIQD(quotes[tr].totalIqd)}
                  </AppText>
                </View>
                <AppText variant="small" color={c.muted} numberOfLines={1} style={styles.tierQuality}>
                  {pick(tierQuality[kind][tr])}
                </AppText>
              </RadioCard>
            ))}
          </View>

          <WhyPrice quote={q} open={showWhy} onToggle={() => setShowWhy((v) => !v)} />

          {orderMedia?.estimated && needs === 'video' && (
            <Note tone="info" icon="clock">
              {L(
                `تعذرت قراءة مدة الفيديو، فحسبنا السعر على أساس ${Math.round(orderMedia.seconds)} ثانية. قد يختلف السعر قليلًا عن المدة الفعلية.`,
                `We could not read the video length, so the price assumes ${Math.round(orderMedia.seconds)} seconds. It may differ slightly from the real length.`,
              )}
            </Note>
          )}
          {missingMedia && (
            <>
              <Note tone="acc" icon="alert">
                {needs === 'video'
                  ? L('أرفق الفيديو الذي تريد مونتاجه قبل التأكيد.', 'Attach the video to edit before confirming.')
                  : fromPhotos
                    ? L(`أرفق صورة واحدة على الأقل (حتى ${MAX_REFERENCE_IMAGES}) قبل التأكيد.`, `Attach at least one photo (up to ${MAX_REFERENCE_IMAGES}) before confirming.`)
                    : L('أرفق صورة المنتج قبل التأكيد.', 'Attach the product photo before confirming.')}
              </Note>
              <Button
                variant="secondary"
                icon={needs === 'video' ? 'video' : 'image'}
                label={needs === 'video' ? L('أرفق الفيديو', 'Attach the video') : fromPhotos ? L('أرفق الصور', 'Attach the photos') : L('أرفق الصورة', 'Attach the photo')}
                onPress={() => editRequest(true)}
              />
            </>
          )}
          <AppText size={11} lineHeight={16} color={c.placeholder} center style={styles.testNote}>
            {L('نسخة تجريبية: يُفعَّل الدفع مع الخادم، ويُنفَّذ الطلب حاليًا على حساب صاحب التطبيق.', "Test build: payment arrives with the server; orders now run on the app owner's account.")}
          </AppText>
        </ScrollView>
        <Footer style={styles.totalBar}>
          <View>
            <AppText size={11} lineHeight={16} color={c.muted}>
              {L(`الإجمالي · مستوى ${pick(tierNames[tier])}`, `Total · ${pick(tierNames[tier])} level`)}
            </AppText>
            <AppText weight="bold" size={20} lineHeight={28}>
              {formatIQD(q.totalIqd)}
            </AppText>
          </View>
          <Button label={L('تأكيد الطلب', 'Confirm order')} style={ui.flex} disabled={missingMedia} onPress={approve} />
        </Footer>
      </Screen>
    );
  }

  if (view === 'form' && service) {
    const ready = quickReady(service, quick);
    const missing =
      service === 'editVideo'
        ? L('أضف الفيديو لتعرض السعر.', 'Add the video to see the price.')
        : services[service].needs === 'image'
          ? L('أضف صورة واحدة على الأقل لتعرض السعر.', 'Add at least one photo to see the price.')
          : L('اكتب طلبك لتعرض السعر.', 'Write your request to see the price.');
    return (
      <Screen edges={['top']}>
        <TopBar title={pick(services[service].name)} subtitle={L('دون اشتراك، تدفع ثمن الطلب فقط', 'No subscription, pay per order')} mode="close" />
        <KeyboardAvoidingView style={ui.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <ExampleStrip kind={service} />
            <QuickForm kind={service} state={quick} onChange={(patch) => setQuick((q) => ({ ...q, ...patch }))} onAdd={addQuick} />
            {note && (
              <Note tone="bad" icon="alert">
                {note}
              </Note>
            )}
          </ScrollView>
          <Footer style={styles.formFooter}>
            {!ready && (
              <AppText size={12} lineHeight={17} color={c.muted} center>
                {missing}
              </AppText>
            )}
            <Button
              label={busy ? L('نجهّز السعر…', 'Preparing the price…') : L('اعرض السعر', 'See price')}
              icon={busy ? undefined : 'receipt'}
              loading={busy}
              disabled={!ready}
              onPress={submitQuick}
            />
            <Button
              variant="ghost"
              icon="chat"
              height={40}
              label={L('تحدث مع المساعد بدلًا من ذلك', 'Chat with the assistant instead')}
              onPress={() => {
                setText(quick.desc.trim() || pick(openers[service]));
                setMedia(quick.media);
                setView('chat');
              }}
            />
          </Footer>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <TopBar
        title={L('اطلب خدمة', 'Order a service')}
        subtitle={L('دون اشتراك، تدفع ثمن الطلب فقط', 'No subscription, pay per order')}
        mode={service ? 'back' : 'close'}
        onBack={service ? () => setView('form') : undefined}
        right={
          failed ? (
            <Badge label={L('تعذّر الاتصال', 'Connection problem')} tone="bad" />
          ) : status === 'online' ? (
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
              {t.media && t.media.length > 0 && (
                <View style={[styles.attachment, { backgroundColor: c.priSoft }]}>
                  <Icon name={t.media[0].kind === 'video' ? 'video' : 'image'} color={c.onPriSoft} size={15} />
                  <AppText size={12} color={c.onPriSoft} numberOfLines={1} style={ui.flex}>
                    {t.media[0].kind === 'video' ? videoLabel(t.media[0]) : t.media.length > 1 ? n(t.media.length, 'photo') : L('صورة', 'Photo')}
                  </AppText>
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  t.from === 'me' ? { backgroundColor: c.primary, borderBottomEndRadius: 4 } : { backgroundColor: c.card, borderColor: c.line, borderWidth: 1, borderBottomStartRadius: 4 },
                ]}>
                <AppText size={14} lineHeight={22} color={t.from === 'me' ? c.onPrimary : c.text}>
                  {t.text}
                </AppText>
              </View>
            </Animated.View>
          ))}
          {busy && (
            <View style={[styles.bubble, styles.theirs, { backgroundColor: c.card, borderColor: c.line, borderWidth: 1 }]}>
              <AppText size={13} color={c.muted}>
                {L('يدرس طلبك…', 'Reading your request…')}
              </AppText>
            </View>
          )}
          {plan && q && (
            <Card onPress={() => setView('quote')} accessibilityLabel={L('اعرض عرض السعر', 'Open the quote')} style={styles.quoteLink}>
              <IconBadge icon="receipt" tone="solid" size={40} />
              <View style={ui.flex}>
                <AppText variant="rowTitle">{plan.title}</AppText>
                <AppText variant="small" color={c.muted}>
                  {L(`عرض السعر جاهز · من ${formatIQD(quotes?.low.totalIqd ?? q.totalIqd)}`, `Quote ready · from ${formatIQD(quotes?.low.totalIqd ?? q.totalIqd)}`)}
                </AppText>
              </View>
              <Icon name="chevronLeft" color={c.placeholder} size={16} />
            </Card>
          )}
          {note && (
            <Note tone="bad" icon="alert">
              {note}
            </Note>
          )}
        </ScrollView>

        <View style={[styles.composer, { borderTopColor: c.line, backgroundColor: c.nav, paddingBottom: insets.bottom + 10 }]}>
          {attachOpen && (
            <View style={styles.attachRow}>
              <Button label={L('فيديو من المعرض', 'Video from gallery')} icon="video" variant="secondary" small style={ui.flex} onPress={() => attach('video')} />
              <Button label={L('صور (حتى 4)', 'Photos (up to 4)')} icon="image" variant="secondary" small style={ui.flex} onPress={() => attach('image')} />
            </View>
          )}
          {media.length > 0 && (
            <View style={[styles.pending, { backgroundColor: c.priSoft }]}>
              <Icon name={media[0].kind === 'video' ? 'video' : 'image'} color={c.onPriSoft} size={15} />
              <AppText size={12.5} color={c.onPriSoft} style={ui.flex} numberOfLines={1}>
                {media[0].kind === 'video'
                  ? L(`فيديو جاهز للإرسال · ${Math.round(media[0].seconds)} ث${media[0].estimated ? ' تقديريًا' : ''}`, `Video ready to send · ${media[0].estimated ? '~' : ''}${Math.round(media[0].seconds)}s`)
                  : media.length > 1
                    ? L(media.length === 2 ? 'صورتان جاهزتان للإرسال' : `${n(media.length, 'photo')} جاهزة للإرسال`, `${n(media.length, 'photo')} ready to send`)
                    : L('صورة جاهزة للإرسال', 'Photo ready to send')}
              </AppText>
              <PressableScale accessibilityRole="button" accessibilityLabel={L('إزالة المرفقات', 'Remove attachments')} onPress={() => setMedia([])} style={styles.remove}>
                <Icon name="close" color={c.onPriSoft} size={15} />
              </PressableScale>
            </View>
          )}
          <View style={styles.inputRow}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={L('إرفاق فيديو أو صورة', 'Attach a video or photo')}
              onPress={() => setAttachOpen((o) => !o)}
              style={[styles.iconBtn, { backgroundColor: c.card, borderColor: c.line, borderWidth: 1 }]}>
              <Icon name={attachOpen ? 'close' : 'plus'} color={c.text} size={20} />
            </PressableScale>
            <TextInput
              ref={input}
              value={text}
              onChangeText={setText}
              placeholder={L('اكتب طلبك', 'Describe your request')}
              placeholderTextColor={c.placeholder}
              multiline
              style={[styles.input, { color: c.text, backgroundColor: c.card, borderColor: c.line, textAlign: rtl ? 'right' : 'left' }]}
            />
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={L('أرسل', 'Send')}
              disabled={(!text.trim() && media.length === 0) || busy}
              onPress={send}
              style={[styles.iconBtn, { backgroundColor: text.trim() || media.length ? c.primary : c.tile }]}>
              <Icon name="send" color={text.trim() || media.length ? c.onPrimary : c.placeholder} size={18} strokeWidth={1.8} />
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  quote: { paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: 24, gap: 12 },
  request: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  mediaRow: { marginTop: 6 },
  edit: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginTop: -4, marginEnd: -6 },
  tiers: { gap: 8 },
  tierHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tierName: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', rowGap: 4 },
  tierQuality: { marginTop: 3 },
  testNote: { marginTop: 4 },
  totalBar: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  thread: { padding: GUTTER, gap: 12 },
  formScroll: { paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: 24, gap: 16 },
  formFooter: { gap: 6 },
  msg: { maxWidth: '86%', gap: 4 },
  mine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.tier },
  attachment: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.chip, minWidth: 140 },
  quoteLink: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  composer: { borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 16, gap: 8 },
  attachRow: { flexDirection: 'row', gap: 8 },
  pending: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.chip, paddingHorizontal: 10, minHeight: 38 },
  remove: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, minHeight: 46, maxHeight: 120, borderRadius: radius.control, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontFamily: font.regular, fontSize: 14 },
  iconBtn: { width: 46, height: 46, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
});
