import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatIQD, radius } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { Badge, Card, Divider, KeyValue, Note, TopBar, ui } from '@/components/ui';
import { useI18n } from '@/i18n';
import { aiErrorText, postJson, useAiStatus, useBusiness } from '@/lib/ai';
import { useTheme } from '@/theme/theme';

type Order = { items: string; total: number; area: string };
type Turn = { id: number; from: 'customer' | 'assistant'; text: string; order?: Order; escalate?: boolean };

const starters = {
  ar: ['ما أسعاركم؟', 'أريد طلبًا بالتوصيل إلى الكرادة', 'تأخر طلبي ساعة كاملة!'],
  en: ['What are your prices?', 'I want a delivery to Karrada', 'My order is an hour late!'],
};

// The owner plays a customer and sees exactly how the assistant would answer
// on WhatsApp: prices from the menu, orders captured, complaints handed over.
export default function TestChatScreen() {
  const { c } = useTheme();
  const { L, lang, rtl } = useI18n();
  const insets = useSafeAreaInsets();
  const business = useBusiness();
  const status = useAiStatus();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroll = useRef<ScrollViewInstance>(null);
  const nextId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [turns, busy]);

  const send = async (raw: string) => {
    const body = raw.trim();
    if (!body || busy) return;
    const next: Turn[] = [...turns, { id: nextId.current++, from: 'customer', text: body }];
    setTurns(next);
    setText('');
    setBusy(true);
    setError(null);
    try {
      const reply = await postJson<{ text: string; order?: Order; escalate?: boolean }>('/api/reply', {
        business,
        messages: next.map((t) => ({ role: t.from === 'customer' ? 'user' : 'assistant', content: t.text })),
      });
      setTurns((t) => [...t, { id: nextId.current++, from: 'assistant', text: reply.text, order: reply.order, escalate: reply.escalate }]);
    } catch (err) {
      setError(aiErrorText(err, lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <TopBar
        title={L('جرّب الرد على عميل', 'Try answering a customer')}
        subtitle={L('اكتب كأنك عميل على واتساب', 'Write as a customer on WhatsApp')}
        right={
          status === 'online' ? (
            <Badge label={L('Claude متصل', 'Claude online')} tone="ok" />
          ) : status === 'locked' ? (
            <Badge label={L('يحتاج إلى رمز', 'Needs code')} tone="acc" />
          ) : status === 'offline' ? (
            <Badge label={L('غير مربوط', 'Not connected')} tone="bad" />
          ) : undefined
        }
      />
      <KeyboardAvoidingView style={ui.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={styles.thread} keyboardShouldPersistTaps="handled">
          <Note icon="info">
            {L(
              `يعرف المساعد أصناف ${business.name} وأسعارها ومناطق التوصيل من معلومات النشاط، ويسجّل الطلب عند اكتماله، ويحيل الشكاوى إلى الموظف.`,
              `The assistant knows ${business.name}'s items, prices and delivery areas from your business details, logs complete orders and hands complaints to staff.`,
            )}
          </Note>
          {turns.map((t) => (
            <View key={t.id} style={[styles.msgWrap, t.from === 'customer' ? styles.theirs : styles.mine]}>
              {t.from === 'assistant' && (
                <View style={styles.by}>
                  <Icon name="sparkle" color={c.muted} size={11} />
                  <AppText size={11} color={c.muted}>
                    {L('المساعد', 'Assistant')}
                  </AppText>
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  t.from === 'customer' ? { backgroundColor: c.tile, borderBottomStartRadius: 4 } : { backgroundColor: c.priSoft, borderBottomEndRadius: 4 },
                ]}>
                <AppText size={14} lineHeight={22} color={t.from === 'customer' ? c.text : c.onPriSoft}>
                  {t.text}
                </AppText>
              </View>
              {t.escalate && <Badge label={L('أُحيلت إلى الموظف', 'Handed to staff')} tone="bad" icon="user" />}
              {t.order && (
                <Card style={styles.order}>
                  <View style={ui.between}>
                    <AppText weight="semibold" size={14}>
                      {L('طلب سجّله المساعد', 'Order logged by the assistant')}
                    </AppText>
                    <Badge label={L('جديد', 'New')} tone="ok" />
                  </View>
                  <KeyValue label={L('الأصناف', 'Items')} value={t.order.items} />
                  {!!t.order.area && <KeyValue label={L('المنطقة', 'Area')} value={t.order.area} />}
                  <Divider />
                  <KeyValue label={L('المجموع', 'Total')} value={formatIQD(t.order.total)} strong />
                </Card>
              )}
            </View>
          ))}
          {busy && (
            <View style={[styles.bubble, styles.mine, { backgroundColor: c.priSoft }]}>
              <AppText size={13} color={c.onPriSoft}>
                {L('يكتب…', 'Typing…')}
              </AppText>
            </View>
          )}
          {error && <Note tone="bad" icon="alert">{error}</Note>}
        </ScrollView>

        <View style={[styles.composer, { borderTopColor: c.line, backgroundColor: c.bg, paddingBottom: insets.bottom + 8 }]}>
          {turns.length === 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prompts} keyboardShouldPersistTaps="handled">
              {starters[lang].map((p) => (
                <PressableScale key={p} accessibilityRole="button" onPress={() => send(p)} style={[styles.prompt, { borderColor: c.line }]}>
                  <AppText size={12.5}>{p}</AppText>
                </PressableScale>
              ))}
            </ScrollView>
          )}
          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={L('اكتب رسالة العميل', 'Type the customer message')}
              placeholderTextColor={c.placeholder}
              style={[styles.input, { color: c.text, backgroundColor: c.tile, textAlign: rtl ? 'right' : 'left' }]}
              onSubmitEditing={() => send(text)}
              returnKeyType="send"
            />
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={L('أرسل', 'Send')}
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
  msgWrap: { maxWidth: '86%', gap: 4 },
  theirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  mine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  by: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bubble: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.tile },
  order: { alignSelf: 'stretch', minWidth: 260 },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, gap: 8 },
  prompts: { gap: 6, paddingHorizontal: 12 },
  prompt: { height: 34, paddingHorizontal: 12, borderRadius: radius.control, borderWidth: 1, justifyContent: 'center' },
  inputRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  input: { flex: 1, height: 44, borderRadius: radius.control, paddingHorizontal: 14, fontFamily: 'ReadexPro_400Regular', fontSize: 14 },
  send: { width: 44, height: 44, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
});
