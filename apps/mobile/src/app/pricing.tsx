import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { formatIQD, formatUsd, planLines, quote, serviceToolKeys, serviceTools, type ServiceParams, type ServiceToolKey } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Badge, Card, Divider, KeyValue, Note, ScrollScreen, SectionTitle, Stepper, TopBar, ui } from '@/components/ui';
import { useServices } from '@/features/services/store';
import { useTheme } from '@/theme/theme';

// Examples the owner can check the margin against.
const samples: { label: string; params: ServiceParams; seconds?: number }[] = [
  { label: 'فيديو من نص 10 ثوانٍ مع موسيقى', params: { kind: 'textVideo', prompt: 'x', duration: 10, music: 'x' } },
  { label: 'إعلان من صورة', params: { kind: 'adImage', prompt: 'x', aspect: '1:1' } },
  { label: 'مونتاج فيديو 45 ث مع ترجمة وموسيقى', params: { kind: 'editVideo', trimStart: null, trimEnd: null, captions: true, music: 'x' }, seconds: 45 },
  { label: 'تعليق صوتي 600 حرف', params: { kind: 'voice', text: 'ا'.repeat(600), voice: 'brian' } },
  { label: 'بوست', params: { kind: 'copy', format: 'post', topic: 'x', details: '' } },
];

// For the app owner: what each tool costs, the dinar rate, and the margin.
// Prices start from fal's live list prices; a typed price overrides one.
export default function PricingScreen() {
  const { c } = useTheme();
  const { settings, setSettings, manual, setManual, live, liveStatus, refreshLive } = useServices();
  const prices = { ...live, ...manual };

  return (
    <ScrollScreen header={<TopBar title="الأسعار والأرباح" subtitle="للإدارة" />}>
      <Note icon="info">
        الأسعار بالدولار لكل وحدة كما يحاسبنا fal. السعر الحي يتحدث تلقائيًا، وأي سعر تكتبه بنفسك يحل محله على هذا الجهاز.
      </Note>

      <SectionTitle title="الربح والعملة" />
      <Card>
        <View style={ui.between}>
          <View style={ui.flex}>
            <AppText weight="medium" size={14}>
              هامش الربح
            </AppText>
            <AppText size={12} color={c.muted}>
              يُضاف فوق كلفة الأدوات
            </AppText>
          </View>
          <Stepper value={Math.round(settings.markup * 100)} onChange={(v) => setSettings({ markup: v / 100 })} min={0} max={400} step={10} format={(v) => `${v}%`} />
        </View>
        <Divider />
        <View style={ui.between}>
          <View style={ui.flex}>
            <AppText weight="medium" size={14}>
              سعر الدولار
            </AppText>
            <AppText size={12} color={c.muted}>
              بالدينار العراقي
            </AppText>
          </View>
          <Stepper value={settings.usdToIqd} onChange={(v) => setSettings({ usdToIqd: v })} min={1000} max={2500} step={10} format={(v) => String(v)} />
        </View>
        <Divider />
        <View style={ui.between}>
          <View style={ui.flex}>
            <AppText weight="medium" size={14}>
              أقل سعر لأي طلب
            </AppText>
          </View>
          <Stepper value={settings.minPrice} onChange={(v) => setSettings({ minPrice: v })} min={0} max={50000} step={500} format={(v) => `${v / 1000} ألف`} />
        </View>
      </Card>

      <SectionTitle title="أسعار الأدوات" action={liveStatus === 'loading' ? undefined : 'حدّث'} onAction={refreshLive} />
      <Card style={styles.list}>
        {serviceToolKeys.map((k, i) => (
          <ToolRow key={k} tool={k} live={live[k]} manual={manual[k]} onSet={(v) => setManual(k, v)} last={i === serviceToolKeys.length - 1} />
        ))}
      </Card>
      {liveStatus === 'failed' && <Note tone="acc">تعذر جلب الأسعار الحية الآن، والأسعار المعروضة هي آخر أسعار معروفة.</Note>}

      <SectionTitle title="كم يدفع الزبون" />
      <Card>
        {samples.map((s) => {
          const q = quote(planLines(s.params, s.seconds ?? 0), settings, prices);
          return (
            <KeyValue key={s.label} label={s.label} sub={`الكلفة ${formatIQD(q.toolsIqd)} · ربحك ${formatIQD(q.feeIqd)}`} value={formatIQD(q.totalIqd)} />
          );
        })}
      </Card>
    </ScrollScreen>
  );
}

function ToolRow({ tool, live, manual, onSet, last }: { tool: ServiceToolKey; live?: number; manual?: number; onSet: (v: number | null) => void; last: boolean }) {
  const { c } = useTheme();
  const t = serviceTools[tool];
  const [draft, setDraft] = useState(manual !== undefined ? String(manual) : '');
  const effective = manual ?? live ?? t.usd;
  const parsed = Number(draft.replace(',', '.'));
  const valid = draft.trim() !== '' && Number.isFinite(parsed) && parsed >= 0;

  return (
    <View style={[styles.tool, !last && { borderBottomColor: c.line, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={ui.between}>
        <View style={ui.flex}>
          <AppText weight="medium" size={14}>
            {t.name}
            <AppText size={12} color={c.muted}>{` · ${t.vendor}`}</AppText>
          </AppText>
          <AppText size={12} color={c.muted}>
            {t.does} · لكل {t.unit}
          </AppText>
        </View>
        <View style={styles.price}>
          <AppText weight="semibold" size={14} style={ui.tabular}>
            {formatUsd(effective)}
          </AppText>
          <Badge label={manual !== undefined ? 'سعرك' : live !== undefined ? 'حي' : 'افتراضي'} tone={manual !== undefined ? 'acc' : live !== undefined ? 'ok' : 'neutral'} />
        </View>
      </View>
      <View style={styles.editRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={`سعرك بالدولار (مثال ${t.usd})`}
          placeholderTextColor={c.placeholder}
          keyboardType="decimal-pad"
          accessibilityLabel={`سعر ${t.name}`}
          style={[styles.input, { color: c.text, backgroundColor: c.tile, borderColor: c.line }]}
        />
        <Button label="احفظ" height={38} disabled={!valid} onPress={() => onSet(parsed)} />
        {manual !== undefined && (
          <Button
            label="الحي"
            variant="ghost"
            height={38}
            onPress={() => {
              setDraft('');
              onSet(null);
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: 2, gap: 0 },
  tool: { paddingVertical: 12, gap: 8 },
  price: { alignItems: 'flex-end', gap: 4 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, height: 38, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontFamily: 'ReadexPro_400Regular', fontSize: 13.5, textAlign: 'left', writingDirection: 'ltr' },
});
