// The quick order form: only the inputs a service needs (its files as large
// tiles, one description, and the few choices that change the result), then
// one message to the order assistant that goes straight to the quote.

import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MAX_REFERENCE_IMAGES, radius, services, type ServiceKind } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Field, ListCard, Segmented, ToggleRow } from '@/components/ui';
import { useI18n, type I18n } from '@/i18n';
import { useTheme } from '@/theme/theme';
import type { PickedMedia } from './media';

export type QuickState = {
  media: PickedMedia[];
  desc: string;
  duration: 5 | 10 | 15;
  music: boolean;
  captions: boolean;
  voice: 'brian' | 'sarah';
  format: 'post' | 'ad' | 'plan';
  aspect: '1:1' | '4:5' | '9:16';
};

export const initialQuick: QuickState = { media: [], desc: '', duration: 10, music: true, captions: true, voice: 'brian', format: 'post', aspect: '1:1' };

const isVideoKind = (k: ServiceKind) => k === 'imageVideo' || k === 'textVideo';

// What the form asks for, per service.
const prompts: Record<ServiceKind, { label: { ar: string; en: string }; placeholder: { ar: string; en: string } }> = {
  editVideo: {
    label: { ar: 'ماذا تريد في المونتاج؟', en: 'What should the edit do?' },
    placeholder: { ar: 'مثال: احذف أول 3 ثوانٍ واجعل الفيديو أقصر', en: 'e.g. Cut the first 3 seconds and make it shorter' },
  },
  imageVideo: {
    label: { ar: 'صف الحركة والأجواء', en: 'Describe the motion and mood' },
    placeholder: { ar: 'مثال: كاميرا تدور ببطء حول البرغر مع بخار وإضاءة دافئة', en: 'e.g. The camera slowly circles the burger, steam, warm light' },
  },
  adImage: {
    label: { ar: 'ماذا يُكتب على الإعلان؟', en: 'What should the ad say?' },
    placeholder: { ar: 'مثال: برغر اللحم بـ 6,000 د.ع، التوصيل مجاني، خلفية داكنة أنيقة', en: 'e.g. Beef burger IQD 6,000, free delivery, an elegant dark background' },
  },
  textVideo: {
    label: { ar: 'صف الفيديو', en: 'Describe the video' },
    placeholder: { ar: 'مثال: فنجان قهوة عربية يُسكب ببطء على طاولة خشبية في ضوء الصباح', en: 'e.g. Arabic coffee poured slowly on a wooden table in morning light' },
  },
  copy: {
    label: { ar: 'الموضوع', en: 'Topic' },
    placeholder: { ar: 'مثال: افتتاح فرعنا الجديد مع خصم 20% في الأسبوع الأول', en: 'e.g. Our new branch opens with 20% off in the first week' },
  },
  voice: {
    label: { ar: 'النص الذي سيُقرأ', en: 'The text to read' },
    placeholder: { ar: 'اكتب النص كما تريد أن يُقرأ تمامًا', en: 'Write the text exactly as it should be read' },
  },
};

// Whether the form has what the service needs.
export function quickReady(kind: ServiceKind, s: QuickState): boolean {
  const photos = s.media.filter((m) => m.kind === 'image').length;
  switch (kind) {
    case 'editVideo':
      return s.media.some((m) => m.kind === 'video');
    case 'imageVideo':
    case 'adImage':
      return photos > 0;
    default:
      return s.desc.trim().length > 0;
  }
}

// The one message the assistant receives, in the customer's language.
export function quickMessage(kind: ServiceKind, s: QuickState, { L, pick, n }: I18n): string {
  const yes = (v: boolean) => (v ? L('نعم', 'yes') : L('لا', 'no'));
  const desc = s.desc.trim();
  const lines = [L(`الخدمة: ${pick(services[kind].name)}`, `Service: ${pick(services[kind].name)}`)];
  switch (kind) {
    case 'editVideo':
      lines.push(desc ? L(`المطلوب: ${desc}`, `Request: ${desc}`) : L('المطلوب: مونتاج الفيديو المرفق', 'Request: edit the attached video'));
      lines.push(L(`نص مكتوب لكلامي على الفيديو: ${yes(s.captions)}`, `Captions of my speech: ${yes(s.captions)}`));
      lines.push(L(`موسيقى: ${yes(s.music)}`, `Music: ${yes(s.music)}`));
      break;
    case 'imageVideo':
    case 'textVideo':
      lines.push(desc ? L(`الوصف: ${desc}`, `Description: ${desc}`) : L('الوصف: فيديو جذاب لمنتجي من الصور المرفقة', 'Description: an attractive video of my product from the attached photos'));
      lines.push(L(`المدة: ${n(s.duration, 'second')}`, `Length: ${n(s.duration, 'second')}`));
      lines.push(L(`موسيقى: ${yes(s.music)}`, `Music: ${yes(s.music)}`));
      break;
    case 'adImage':
      lines.push(desc ? L(`المطلوب في الإعلان: ${desc}`, `Ad request: ${desc}`) : L('المطلوب: إعلان أنيق من صورة المنتج', 'Request: an elegant ad from the product photo'));
      lines.push(L(`المقاس: ⁦${s.aspect}⁩`, `Size: ${s.aspect}`));
      break;
    case 'copy':
      lines.push(L(`النوع: ${{ post: 'منشور', ad: 'نص إعلان', plan: 'خطة محتوى لشهر' }[s.format]}`, `Type: ${{ post: 'a post', ad: 'ad copy', plan: 'a month of content' }[s.format]}`));
      lines.push(L(`الموضوع: ${desc}`, `Topic: ${desc}`));
      break;
    case 'voice':
      lines.push(L(`الصوت: ${s.voice === 'sarah' ? 'نسائي' : 'رجالي'}`, `Voice: ${s.voice === 'sarah' ? 'female' : 'male'}`));
      lines.push(L(`النص: ${desc}`, `Text: ${desc}`));
      break;
  }
  const photos = s.media.filter((m) => m.kind === 'image').length;
  const video = s.media.find((m) => m.kind === 'video');
  if (video) lines.push(L(`المرفقات: فيديو مدته ${n(Math.round(video.seconds), 'second')}`, `Attached: a ${Math.round(video.seconds)}-second video`));
  else if (photos) lines.push(L(`المرفقات: ${n(photos, 'photo')}`, `Attached: ${n(photos, 'photo')}`));
  return lines.join('\n');
}

function AddTile({ label, sub, icon, onPress, tall }: { label: string; sub?: string; icon: 'image' | 'video' | 'plus'; onPress: () => void; tall?: boolean }) {
  const { c } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      pressedScale={0.98}
      style={[styles.add, tall ? styles.addTall : styles.fillTile, { borderColor: c.lineStrong, backgroundColor: c.card }]}>
      <View style={[styles.addIcon, { backgroundColor: c.priSoft }]}>
        <Icon name={icon} color={c.onPriSoft} size={22} />
      </View>
      <AppText weight="semibold" size={13.5} lineHeight={20} center>
        {label}
      </AppText>
      {sub && (
        <AppText size={12} lineHeight={17} color={c.muted} center>
          {sub}
        </AppText>
      )}
    </PressableScale>
  );
}

// Overlays sit at physical corners: the remove button at the top end, the
// photo number at the bottom start.
function RemoveButton({ onPress, label }: { onPress: () => void; label: string }) {
  const { rtl } = useI18n();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.remove, rtl ? styles.left : styles.right]} hitSlop={6}>
      <Icon name="close" color="#F5F2EC" size={15} strokeWidth={2} />
    </PressableScale>
  );
}

// The service's files as large tiles with thumbnails. Tiles hold only an
// image, so their size is set in pixels from the measured width: percentage
// widths with an aspect ratio collapse to nothing on Android.
function Attachments({ kind, media, onAdd, onRemove }: { kind: ServiceKind; media: PickedMedia[]; onAdd: () => void; onRemove: (i: number) => void }) {
  const { c } = useTheme();
  const { L, n, rtl } = useI18n();
  const [width, setWidth] = useState(0);
  const measure = (e: { nativeEvent: { layout: { width: number } } }) => setWidth(Math.round(e.nativeEvent.layout.width));
  const cellWidth = width ? Math.floor((width - GRID_GAP) / 2) : 0;
  const cellSize = cellWidth ? { width: cellWidth, height: Math.round(cellWidth * 0.75) } : styles.cell;
  const singleSize = width ? { width, height: Math.round(width * 0.75) } : styles.single;
  if (kind === 'editVideo') {
    const v = media.find((m) => m.kind === 'video');
    if (!v) return <AddTile tall icon="video" label={L('اختر الفيديو من المعرض', 'Choose the video from your gallery')} sub={L('حتى 3 دقائق', 'Up to 3 minutes')} onPress={onAdd} />;
    return (
      <PressableScale accessibilityRole="button" accessibilityLabel={L('غيّر الفيديو', 'Change the video')} onPress={onAdd} pressedScale={0.99} style={[styles.videoTile, { backgroundColor: c.hero }]}>
        <View style={[styles.addIcon, { backgroundColor: c.heroTile }]}>
          <Icon name="video" color={c.heroAccent} size={22} />
        </View>
        <View style={styles.flex}>
          <AppText weight="semibold" size={14} lineHeight={20} color={c.heroText} numberOfLines={1}>
            {L('الفيديو جاهز', 'Video ready')}
          </AppText>
          <AppText size={12.5} lineHeight={18} color={c.heroMuted} numberOfLines={1}>
            {v.estimated ? L(`نحو ${Math.round(v.seconds)} ث (تقديري) · اضغط للتغيير`, `~${Math.round(v.seconds)}s (estimate) · tap to change`) : L(`${n(Math.round(v.seconds), 'second')} · اضغط للتغيير`, `${Math.round(v.seconds)}s · tap to change`)}
          </AppText>
        </View>
        <View style={styles.removeRoom} />
        <RemoveButton label={L('إزالة الفيديو', 'Remove the video')} onPress={() => onRemove(0)} />
      </PressableScale>
    );
  }
  const photos = media.filter((m) => m.kind === 'image');
  if (kind === 'adImage') {
    const p = photos[0];
    if (!p) return <AddTile tall icon="image" label={L('أضف صورة المنتج', 'Add the product photo')} sub={L('صورة واضحة على خلفية بسيطة', 'A clear photo on a plain background')} onPress={onAdd} />;
    return (
      <View onLayout={measure}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={L('غيّر الصورة', 'Change the photo')}
          onPress={onAdd}
          pressedScale={0.99}
          style={[styles.singleBox, singleSize, { backgroundColor: c.tile }]}>
          <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <RemoveButton label={L('إزالة الصورة', 'Remove the photo')} onPress={() => onRemove(0)} />
        </PressableScale>
      </View>
    );
  }
  // imageVideo: up to four photos in a two-column grid.
  if (!photos.length) {
    return <AddTile tall icon="image" label={L(`أضف حتى ${n(MAX_REFERENCE_IMAGES, 'photo')} لمنتجك`, `Add up to ${n(MAX_REFERENCE_IMAGES, 'photo')} of your product`)} sub={L('من زوايا مختلفة إن أمكن', 'From different angles if you can')} onPress={onAdd} />;
  }
  return (
    <View style={styles.grid} onLayout={measure}>
      {photos.map((p, i) => (
        <View key={`${p.uri}${i}`} style={[styles.cellBox, cellSize, { backgroundColor: c.tile }]}>
          <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={L(`الصورة ${i + 1}`, `Photo ${i + 1}`)} />
          <View style={[styles.cellNum, rtl ? styles.right : styles.left]}>
            <AppText weight="semibold" size={11} lineHeight={15} color="#F5F2EC">
              {i + 1}
            </AppText>
          </View>
          <RemoveButton label={L(`إزالة الصورة ${i + 1}`, `Remove photo ${i + 1}`)} onPress={() => onRemove(i)} />
        </View>
      ))}
      {photos.length < MAX_REFERENCE_IMAGES && (
        <View style={cellWidth ? cellSize : styles.cellWrap}>
          <AddTile icon="plus" label={L('أضف صورة', 'Add a photo')} sub={L(`${photos.length} من ${MAX_REFERENCE_IMAGES}`, `${photos.length} of ${MAX_REFERENCE_IMAGES}`)} onPress={onAdd} />
        </View>
      )}
    </View>
  );
}

function Label({ text }: { text: string }) {
  const { c } = useTheme();
  return (
    <AppText weight="medium" size={12.5} lineHeight={18} color={c.muted} style={styles.label}>
      {text}
    </AppText>
  );
}

export function QuickForm({
  kind,
  state,
  onChange,
  onAdd,
}: {
  kind: ServiceKind;
  state: QuickState;
  onChange: (patch: Partial<QuickState>) => void;
  onAdd: () => void;
}) {
  const { L, pick } = useI18n();
  const needs = services[kind].needs;
  const p = prompts[kind];
  return (
    <View style={styles.form}>
      {needs && (
        <View>
          <Label text={kind === 'editVideo' ? L('الفيديو', 'Your video') : kind === 'adImage' ? L('صورة المنتج', 'Product photo') : L('صورك', 'Your photos')} />
          <Attachments kind={kind} media={state.media} onAdd={onAdd} onRemove={(i) => onChange({ media: state.media.filter((_, k) => k !== i) })} />
        </View>
      )}

      {kind === 'copy' && (
        <View>
          <Label text={L('النوع', 'Type')} />
          <Segmented
            value={state.format}
            onChange={(format) => onChange({ format })}
            options={[
              { value: 'post', label: L('منشور', 'Post') },
              { value: 'ad', label: L('إعلان', 'Ad') },
              { value: 'plan', label: L('خطة شهر', 'Month plan') },
            ]}
          />
        </View>
      )}
      {kind === 'voice' && (
        <View>
          <Label text={L('الصوت', 'Voice')} />
          <Segmented
            value={state.voice}
            onChange={(voice) => onChange({ voice })}
            options={[
              { value: 'brian', label: L('صوت رجالي', 'Male voice') },
              { value: 'sarah', label: L('صوت نسائي', 'Female voice') },
            ]}
          />
        </View>
      )}

      <Field
        label={pick(p.label)}
        placeholder={pick(p.placeholder)}
        value={state.desc}
        onChangeText={(desc) => onChange({ desc })}
        multiline
        maxLength={kind === 'voice' ? 3000 : 1200}
      />

      {kind === 'adImage' && (
        <View>
          <Label text={L('المقاس', 'Size')} />
          <Segmented
            value={state.aspect}
            onChange={(aspect) => onChange({ aspect })}
            options={[
              { value: '1:1', label: L('مربع', 'Square') },
              { value: '4:5', label: L('عمودي', 'Portrait') },
              { value: '9:16', label: L('ستوري', 'Story') },
            ]}
          />
        </View>
      )}
      {isVideoKind(kind) && (
        <View>
          <Label text={L('المدة', 'Length')} />
          <Segmented
            value={String(state.duration) as '5' | '10' | '15'}
            onChange={(v) => onChange({ duration: Number(v) as 5 | 10 | 15 })}
            options={[
              { value: '5', label: L('5 ث', '5 s') },
              { value: '10', label: L('10 ث', '10 s') },
              { value: '15', label: L('15 ث', '15 s') },
            ]}
          />
        </View>
      )}
      {(isVideoKind(kind) || kind === 'editVideo') && (
        <ListCard>
          {kind === 'editVideo' && (
            <ToggleRow icon="doc" title={L('نص مكتوب لكلامك', 'Captions of your speech')} value={state.captions} onChange={(captions) => onChange({ captions })} />
          )}
          <ToggleRow
            icon="sparkle"
            title={L('موسيقى', 'Music')}
            subtitle={kind === 'editVideo' ? L('تحل محل الصوت الأصلي', 'Replaces the original sound') : L('تناسب أجواء الفيديو', 'To match the mood')}
            value={state.music}
            onChange={(music) => onChange({ music })}
            last
          />
        </ListCard>
      )}
    </View>
  );
}

const GRID_GAP = 10;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  form: { gap: 16 },
  label: { marginBottom: 6 },
  add: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: radius.tier, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 12 },
  addTall: { minHeight: 148 },
  fillTile: { flex: 1 },
  addIcon: { width: 44, height: 44, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  videoTile: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 96, borderRadius: radius.tier, padding: 14 },
  single: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.tier, overflow: 'hidden' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  cellBox: { borderRadius: radius.tier, overflow: 'hidden' },
  singleBox: { borderRadius: radius.tier, overflow: 'hidden' },
  cell: { width: '48.5%', aspectRatio: 4 / 3, borderRadius: radius.tier, overflow: 'hidden' },
  cellWrap: { width: '48.5%', aspectRatio: 4 / 3 },
  left: { left: 8 },
  right: { right: 8 },
  cellNum: { position: 'absolute', bottom: 8, minWidth: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,19,43,0.72)' },
  removeRoom: { width: 26 },
  remove: { position: 'absolute', top: 8, width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,19,43,0.72)' },
});
