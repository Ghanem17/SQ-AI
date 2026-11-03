import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { formatIQD, formatUsd, planLines, quote, serviceTiers, serviceToolKeys, serviceTools, tierNames, type ServiceParams, type ServiceToolKey } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Badge, Card, Divider, Note, ScrollScreen, SectionTitle, Stepper, TopBar, ui } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useServices } from '@/features/services/store';
import { useTheme } from '@/theme/theme';

// Examples the owner can check the margin against.
const samples: { label: { ar: string; en: string }; params: ServiceParams; seconds?: number }[] = [
  { label: { ar: 'فيديو من نص مدته 10 ثوانٍ مع موسيقى', en: '10-second video from text, with music' }, params: { kind: 'textVideo', prompt: 'x', duration: 10, music: 'x' } },
  { label: { ar: 'إعلان من صورة', en: 'Ad from a photo' }, params: { kind: 'adImage', prompt: 'x', aspect: '1:1' } },
  {
    label: { ar: 'مونتاج فيديو مدته 45 ثانية مع نص مكتوب وموسيقى', en: '45-second video edit with captions and music' },
    params: { kind: 'editVideo', trimStart: null, trimEnd: null, captions: true, music: 'x' },
    seconds: 45,
  },
  { label: { ar: 'تعليق صوتي من 600 حرف', en: '600-character voice-over' }, params: { kind: 'voice', text: 'ا'.repeat(600), voice: 'brian' } },
  { label: { ar: 'منشور', en: 'A post' }, params: { kind: 'copy', format: 'post', topic: 'x', details: '' } },
];

// For the app owner: what each tool costs, the dinar rate, and the margin.
// Prices start from fal's live list prices; a typed price overrides one.
export default function PricingScreen() {
  const { c } = useTheme();
  const { L, pick } = useI18n();
  const { settings, setSettings, manual, setManual, live, liveStatus, refreshLive } = useServices();
  const prices = { ...live, ...manual };

  return (
    <ScrollScreen header={<TopBar title={L('الأسعار والأرباح', 'Prices and margin')} subtitle={L('للإدارة', 'Owner only')} />}>
      <Note icon="info">
        {L(
          'الأسعار بالدولار لكل وحدة كما يحاسبنا fal. يتحدّث السعر الحي تلقائيًا، وأي سعر تكتبه بنفسك يحل محله على هذا الجهاز.',
          'Prices are in dollars per unit, as fal bills us. Live prices update by themselves; any price you type replaces it on this device.',
        )}
      </Note>

      <SectionTitle title={L('الربح والعملة', 'Margin and currency')} />
      <Card>
        <View style={ui.between}>
          <View style={ui.flex}>
            <AppText weight="medium" size={14}>
              {L('هامش الربح', 'Margin')}
            </AppText>
            <AppText size={12} color={c.muted}>
              {L('يُضاف فوق تكلفة الأدوات', 'Added on top of the tools cost')}
            </AppText>
          </View>
          <Stepper value={Math.round(settings.markup * 100)} onChange={(v) => setSettings({ markup: v / 100 })} min={0} max={400} step={10} format={(v) => `${v}%`} />
        </View>
        <Divider />
        <View style={ui.between}>
          <View style={ui.flex}>
            <AppText weight="medium" size={14}>
              {L('سعر الدولار', 'Dollar rate')}
            </AppText>
            <AppText size={12} color={c.muted}>
              {L('بالدينار العراقي', 'In Iraqi dinars')}
            </AppText>
          </View>
          <Stepper value={settings.usdToIqd} onChange={(v) => setSettings({ usdToIqd: v })} min={1000} max={2500} step={10} format={(v) => String(v)} />
        </View>
        <Divider />
        <View style={ui.between}>
          <View style={ui.flex}>
            <AppText weight="medium" size={14}>
              {L('أدنى سعر لأي طلب', 'Minimum order price')}
            </AppText>
            <AppText size={12} color={c.muted}>
              {L('للمستوى المنخفض، ×1.5 للمتوسط و×2.5 للعالي', 'For low; ×1.5 for medium, ×2.5 for high')}
            </AppText>
          </View>
          <Stepper value={settings.minPrice} onChange={(v) => setSettings({ minPrice: v })} min={0} max={50000} step={500} format={(v) => L(`${v / 1000} ألف`, `${v / 1000}k`)} />
        </View>
      </Card>

      <SectionTitle title={L('أسعار الأدوات', 'Tool prices')} action={liveStatus === 'loading' ? undefined : L('حدّث', 'Refresh')} onAction={refreshLive} />
      <Card style={styles.list}>
        {serviceToolKeys.map((k, i) => (
          <ToolRow key={k} tool={k} live={live[k]} manual={manual[k]} onSet={(v) => setManual(k, v)} last={i === serviceToolKeys.length - 1} />
        ))}
      </Card>
      {liveStatus === 'failed' && (
        <Note tone="acc">{L('تعذر جلب الأسعار الحية الآن، والأسعار المعروضة هي آخر أسعار معروفة.', 'Live prices could not load; these are the last known prices.')}</Note>
      )}

      <SectionTitle title={L('ما يدفعه العميل في كل مستوى', 'What the customer pays at each level')} />
      <Card>
        {samples.map((s, i) => (
          <View key={s.label.en} style={[styles.sample, i < samples.length - 1 && { borderBottomColor: c.line, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <AppText weight="medium" size={13.5}>
              {pick(s.label)}
            </AppText>
            <View style={styles.sampleTiers}>
              {serviceTiers.map((tier) => {
                const q = quote(planLines(s.params, s.seconds ?? 0, tier), settings, prices, tier);
                return (
                  <View key={tier} style={[styles.sampleTier, { backgroundColor: c.tile }]}>
                    <AppText size={11.5} color={c.muted}>
                      {pick(tierNames[tier])}
                    </AppText>
                    <AppText weight="semibold" size={13} style={ui.tabular}>
                      {formatIQD(q.totalIqd)}
                    </AppText>
                    <AppText size={10.5} color={c.placeholder} style={ui.tabular}>
                      {L(`ربحك ${formatIQD(q.feeIqd)}`, `Margin ${formatIQD(q.feeIqd)}`)}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </Card>
    </ScrollScreen>
  );
}

function ToolRow({ tool, live, manual, onSet, last }: { tool: ServiceToolKey; live?: number; manual?: number; onSet: (v: number | null) => void; last: boolean }) {
  const { c } = useTheme();
  const { L, pick } = useI18n();
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
            {pick(t.does)} · {L(`لكل ${t.unit.ar}`, `per ${t.unit.en}`)}
          </AppText>
        </View>
        <View style={styles.price}>
          <AppText weight="semibold" size={14} style={ui.tabular}>
            {formatUsd(effective)}
          </AppText>
          <Badge
            label={manual !== undefined ? L('سعرك', 'Yours') : live !== undefined ? L('حي', 'Live') : L('تقديري', 'Estimate')}
            tone={manual !== undefined ? 'acc' : live !== undefined ? 'ok' : 'neutral'}
          />
        </View>
      </View>
      <View style={styles.editRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={L(`سعرك بالدولار (مثال ${t.usd})`, `Your price in USD (e.g. ${t.usd})`)}
          placeholderTextColor={c.placeholder}
          keyboardType="decimal-pad"
          accessibilityLabel={L(`سعر ${t.name}`, `${t.name} price`)}
          style={[styles.input, { color: c.text, backgroundColor: c.tile, borderColor: c.line }]}
        />
        <Button label={L('احفظ', 'Save')} height={38} disabled={!valid} onPress={() => onSet(parsed)} />
        {manual !== undefined && (
          <Button
            label={L('الحي', 'Live')}
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
  sample: { paddingVertical: 10, gap: 8 },
  sampleTiers: { flexDirection: 'row', gap: 6 },
  sampleTier: { flex: 1, borderRadius: 10, padding: 8, gap: 1 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, height: 38, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontFamily: 'ReadexPro_400Regular', fontSize: 13.5, textAlign: 'left', writingDirection: 'ltr' },
});
