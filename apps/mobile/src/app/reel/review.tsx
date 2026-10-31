import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { formatIQD, platformNames, radius, reelPrice, tiers, tools } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Badge, Card, Chip, Divider, KeyValue, Note, ScrollScreen, SectionTitle, TopBar, ui } from '@/components/ui';
import { bestTime } from '@/mock/data';
import { sampleToday } from '@/mock/today';
import { useTheme } from '@/theme/theme';

const changes = ['غيّر الموسيقى', 'افتتاحية أقوى', 'كابشن أقصر', 'نص أكبر على الشاشة', 'لون أدفأ'];

// The finished reel waiting for the owner's approval before it goes out.
export default function ReviewScreen() {
  const { c } = useTheme();
  const reel = sampleToday.pendingReel;
  const [mode, setMode] = useState<'review' | 'changes' | 'approved' | 'sent'>('review');
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState('');

  if (mode === 'approved' || mode === 'sent') {
    const approved = mode === 'approved';
    return (
      <ScrollScreen header={<TopBar title={reel?.title ?? 'الريل'} mode="none" />} footer={<Button label="العودة للرئيسية" onPress={() => router.dismissTo('/(tabs)')} />}>
        <View style={[styles.done, { backgroundColor: approved ? c.okSoft : c.priSoft }]}>
          <Icon name={approved ? 'check' : 'refresh'} color={approved ? c.ok : c.onPriSoft} size={22} strokeWidth={2.2} />
          <View style={ui.flex}>
            <AppText weight="semibold" size={15} color={approved ? c.ok : c.onPriSoft}>
              {approved ? 'تمت الموافقة' : 'أرسلنا طلب التعديل'}
            </AppText>
            <AppText size={12.5} color={approved ? c.ok : c.onPriSoft}>
              {approved ? `يُنشر ${bestTime.label} على ${reel?.platforms.map((p) => platformNames[p]).join(' و')}` : 'تصلك النسخة المعدّلة خلال ساعتين، بدون كلفة إضافية.'}
            </AppText>
          </View>
        </View>
        {approved && (
          <Card onPress={() => router.push('/reel/promote')} accessibilityLabel="روّج هذا الريل" style={styles.promo}>
            <View style={[styles.promoIcon, { backgroundColor: c.accSoft }]}>
              <Icon name="ads" color={c.acc} size={18} />
            </View>
            <View style={ui.flex}>
              <AppText weight="medium" size={14.5}>
                روّج هذا الريل
              </AppText>
              <AppText size={12.5} color={c.muted}>
                ريلز الأكل عندك تجيب طلبات بكلفة {formatIQD(sampleToday.costPerOrder)} للطلب
              </AppText>
            </View>
            <Icon name="chevronLeft" color={c.placeholder} size={18} />
          </Card>
        )}
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen
      header={<TopBar title="راجع الريل" subtitle={reel?.title} />}
      footer={
        mode === 'review' ? (
          <View style={styles.actions}>
            <Button label="اطلب تعديل" variant="secondary" style={ui.flex} onPress={() => setMode('changes')} />
            <Button label="وافق وانشر" icon="check" style={styles.approve} onPress={() => setMode('approved')} />
          </View>
        ) : (
          <View style={styles.actions}>
            <Button label="رجوع" variant="secondary" style={ui.flex} onPress={() => setMode('review')} />
            <Button label="أرسل التعديل" style={styles.approve} disabled={picked.length === 0 && note.trim().length === 0} onPress={() => setMode('sent')} />
          </View>
        )
      }>
      <View style={styles.previewWrap}>
        <View style={[styles.preview, { backgroundColor: c.hero }]}>
          <View style={styles.previewTop}>
            <Badge label="0:15" />
            <Badge label="1080p" />
          </View>
          <View style={[styles.play, { borderColor: c.heroText }]}>
            <Icon name="play" color={c.heroText} size={26} />
          </View>
          <View style={styles.subtitle}>
            <AppText weight="semibold" size={13} color="#FFFFFF" center>
              الكباب على الفحم، من النار للصحن
            </AppText>
          </View>
        </View>
        <AppText size={12} color={c.placeholder} center>
          معاينة · يُعرض الفيديو هنا بعد ربط السيرفر
        </AppText>
      </View>

      {mode === 'changes' ? (
        <>
          <SectionTitle title="ماذا تريد أن نغيّر؟" />
          <View style={ui.wrap}>
            {changes.map((ch) => (
              <Chip
                key={ch}
                label={ch}
                selected={picked.includes(ch)}
                onPress={() => setPicked((p) => (p.includes(ch) ? p.filter((x) => x !== ch) : [...p, ch]))}
              />
            ))}
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="ملاحظة إضافية (اختياري)"
            placeholderTextColor={c.placeholder}
            multiline
            style={[styles.input, { color: c.text, borderColor: c.lineStrong, backgroundColor: c.tile }]}
          />
          <Note>التعديل الأول مجاني. يصلك الريل المعدّل للموافقة من جديد.</Note>
        </>
      ) : (
        <>
          <Card>
            <KeyValue label="المنصات" value={reel?.platforms.map((p) => platformNames[p]).join('، ') ?? ''} />
            <KeyValue label="وقت النشر" value={bestTime.label} />
            <KeyValue label="الجودة" value={tiers.pro.name} />
            <Divider />
            <KeyValue label="الكلفة" value={formatIQD(reelPrice('pro'))} strong />
          </Card>

          <SectionTitle title="الكابشن" />
          <Card>
            <AppText size={14} lineHeight={23}>
              كباب على الفحم، من النار للصحن خلال دقائق 🔥{'\n'}اطلب الآن عبر الواتساب، التوصيل مجاني للكرادة.{'\n'}#بغداد #كباب #مطاعم_بغداد
            </AppText>
          </Card>

          <SectionTitle title="ما الذي تم" />
          <Card>
            {tiers.pro.items.map((item) => (
              <View key={item.task} style={styles.work}>
                <Icon name="check" color={c.ok} size={15} strokeWidth={2.4} />
                <AppText size={13.5} style={ui.flex}>
                  {item.task}
                </AppText>
                <AppText size={12} color={c.muted}>
                  {item.tools.map((t) => tools[t].name).join('، ')}
                </AppText>
              </View>
            ))}
          </Card>
        </>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8 },
  approve: { flex: 1.4 },
  previewWrap: { alignItems: 'center', gap: 8 },
  preview: { width: '58%', aspectRatio: 9 / 16, borderRadius: radius.tile, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewTop: { position: 'absolute', top: 10, start: 10, end: 10, flexDirection: 'row', justifyContent: 'space-between' },
  play: { width: 58, height: 58, borderRadius: 29, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  subtitle: { position: 'absolute', bottom: 18, start: 12, end: 12, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 6, paddingVertical: 4 },
  work: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 28 },
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: radius.control,
    padding: 12,
    fontFamily: 'ReadexPro_400Regular',
    fontSize: 14,
    textAlign: 'right',
    textAlignVertical: 'top',
    writingDirection: 'rtl',
  },
  done: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.tile },
  promo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  promoIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
