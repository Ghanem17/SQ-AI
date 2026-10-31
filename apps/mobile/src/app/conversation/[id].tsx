import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatIQD, platformNames, radius } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { Badge, Card, Divider, KeyValue, TopBar, ui } from '@/components/ui';
import { conversations, tagLabels, type Message } from '@/mock/data';
import { tagTone } from '@/features/inbox/tags';
import { useTheme } from '@/theme/theme';

// One conversation. The assistant's replies are marked; the owner can take
// over, which pauses the assistant for this customer.
export default function ConversationScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const convo = conversations.find((x) => x.id === id) ?? conversations[0];
  const [messages, setMessages] = useState<Message[]>(convo.messages);
  const [takenOver, setTakenOver] = useState(convo.tag === 'needsStaff');
  const [text, setText] = useState('');
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const send = () => {
    const body = text.trim();
    if (!body) return;
    const now = new Date();
    setMessages((m) => [...m, { id: `s${m.length}`, from: 'staff', text: body, time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}` }]);
    setText('');
  };

  return (
    <Screen edges={['top']}>
      <TopBar
        title={convo.name}
        subtitle={`${platformNames[convo.platform]} · ${takenOver ? 'أنت ترد الآن' : 'المساعد يرد تلقائيًا'}`}
        right={<Badge label={tagLabels[convo.tag]} tone={tagTone[convo.tag]} />}
      />
      <KeyboardAvoidingView style={ui.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.thread}>
          {messages.map((m) => {
            const mine = m.from !== 'customer';
            return (
              <View key={m.id} style={[styles.msgWrap, mine ? styles.mine : styles.theirs]}>
                {m.from === 'assistant' && (
                  <View style={styles.by}>
                    <Icon name="sparkle" color={c.muted} size={11} />
                    <AppText size={11} color={c.muted}>
                      المساعد
                    </AppText>
                  </View>
                )}
                {m.from === 'staff' && (
                  <AppText size={11} color={c.muted} style={styles.by}>
                    أنت
                  </AppText>
                )}
                <View
                  style={[
                    styles.bubble,
                    mine
                      ? { backgroundColor: m.from === 'staff' ? c.primary : c.priSoft, borderBottomLeftRadius: 4 }
                      : { backgroundColor: c.tile, borderBottomRightRadius: 4 },
                  ]}>
                  <AppText size={14} lineHeight={22} color={m.from === 'staff' ? c.onPrimary : mine ? c.onPriSoft : c.text}>
                    {m.text}
                  </AppText>
                </View>
                <AppText size={10.5} color={c.placeholder} style={ui.tabular}>
                  {m.time}
                </AppText>
              </View>
            );
          })}

          {convo.order && (
            <Card style={styles.order}>
              <View style={ui.between}>
                <AppText weight="semibold" size={14}>
                  طلب سجّله المساعد
                </AppText>
                <Badge label={orderConfirmed ? 'مؤكد' : 'بانتظار التأكيد'} tone={orderConfirmed ? 'ok' : 'acc'} />
              </View>
              <KeyValue label="الأصناف" value={convo.order.items} />
              <KeyValue label="المنطقة" value={convo.order.area} />
              <Divider />
              <KeyValue label="المجموع" value={formatIQD(convo.order.total)} strong />
              {!orderConfirmed && <Button label="أكّد وأرسل للمطبخ" height={42} onPress={() => setOrderConfirmed(true)} />}
            </Card>
          )}
        </ScrollView>

        <View style={[styles.composer, { borderTopColor: c.line, backgroundColor: c.bg, paddingBottom: insets.bottom + 8 }]}>
          {!takenOver ? (
            <View style={styles.takeRow}>
              <AppText size={12.5} color={c.muted} style={ui.flex}>
                المساعد يتابع هذه المحادثة. تدخّل إذا أردت الرد بنفسك.
              </AppText>
              <Button label="تولَّ المحادثة" variant="outline" height={38} onPress={() => setTakenOver(true)} />
            </View>
          ) : (
            <>
              <View style={styles.takeRow}>
                <AppText size={12} color={c.muted} style={ui.flex}>
                  المساعد متوقف لهذه المحادثة
                </AppText>
                <PressableScale accessibilityRole="button" onPress={() => setTakenOver(false)} style={styles.resume}>
                  <AppText size={12.5} weight="medium" color={c.primary}>
                    أعد المساعد
                  </AppText>
                </PressableScale>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="اكتب ردك"
                  placeholderTextColor={c.placeholder}
                  style={[styles.input, { color: c.text, backgroundColor: c.tile }]}
                  onSubmitEditing={send}
                  returnKeyType="send"
                />
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel="أرسل"
                  disabled={!text.trim()}
                  onPress={send}
                  style={[styles.send, { backgroundColor: text.trim() ? c.primary : c.tile }]}>
                  <Icon name="send" color={text.trim() ? c.onPrimary : c.placeholder} size={18} />
                </PressableScale>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  thread: { padding: 16, gap: 12 },
  msgWrap: { maxWidth: '82%', gap: 3 },
  theirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  mine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  by: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bubble: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.tile },
  order: { marginTop: 4 },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingTop: 10, gap: 8 },
  takeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resume: { minHeight: 36, justifyContent: 'center' },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, height: 44, borderRadius: radius.control, paddingHorizontal: 14, fontFamily: 'ReadexPro_400Regular', fontSize: 14, textAlign: 'right' },
  send: { width: 44, height: 44, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
});
