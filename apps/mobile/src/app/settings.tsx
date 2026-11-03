import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { formatIQD, paletteNames, palettes, platformNames, tiers, type AccountType, type PaletteName, type Platform, type ThemePreference } from '@sq/shared';
import { PressableScale } from '@/components/PressableScale';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Avatar, Badge, Card, ListRow, PlatformTag, ScrollScreen, SectionTitle, Segmented, TopBar, ui } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useAiStatus } from '@/lib/ai';
import { useSession } from '@/state/session';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

const linked: Platform[] = ['instagram', 'facebook', 'tiktok', 'whatsapp'];

export default function SettingsScreen() {
  const { c, scheme } = useTheme();
  const { themePreference, setThemePreference, palette, setPalette, signOut, displayName, phone, accountType, chooseAccountType, lang, setLang } = useSession();
  const { L, pick } = useI18n();
  const { plan, automation, orders } = useStudio();
  const ai = useAiStatus();
  const name = displayName ?? L('حسابي', 'My account');

  return (
    <ScrollScreen header={<TopBar title={L('الحساب والإعدادات', 'Account and settings')} />}>
      <Card style={styles.profile}>
        <Avatar name={name} size={52} />
        <View style={ui.flex}>
          <AppText weight="semibold" size={17}>
            {name}
          </AppText>
          {phone && (
            <AppText size={13} color={c.muted} style={styles.ltr}>
              {phone}
            </AppText>
          )}
        </View>
        <Badge label={accountType === 'creator' ? L('صانع محتوى', 'Creator') : L('متجر أو مطعم', 'Shop or restaurant')} tone="pri" />
      </Card>

      <SectionTitle title={L('اللغة', 'Language')} />
      <Segmented<'ar' | 'en'>
        options={[
          { value: 'ar', label: 'العربية' },
          { value: 'en', label: 'English' },
        ]}
        value={lang}
        onChange={setLang}
      />

      <SectionTitle title={L('الاشتراك والتشغيل', 'Plan and automation')} />
      <Card style={styles.list}>
        <ListRow
          icon="calendar"
          title={L('الخطة الشهرية', 'Monthly plan')}
          subtitle={plan.active ? L(`${plan.reels} ريلز · ${tiers[plan.tier].name.ar}`, `${plan.reels} reels · ${tiers[plan.tier].name.en}`) : L('غير مفعّلة', 'Off')}
          onPress={() => router.push('/plan')}
        />
        <ListRow
          icon="bolt"
          title={L('الوضع التلقائي', 'Autopilot')}
          subtitle={automation.enabled ? L(`يعمل · السقف ${formatIQD(automation.monthlyCap)}`, `On · cap ${formatIQD(automation.monthlyCap)}`) : L('متوقف', 'Off')}
          onPress={() => router.push('/automation')}
        />
        <ListRow
          icon="receipt"
          title={L('طلبات الريلز', 'Reel orders')}
          subtitle={orders.length ? L(`${orders.length} طلبات على هذا الجهاز`, `${orders.length} orders on this device`) : L('لا توجد طلبات بعد', 'No orders yet')}
        />
        <ListRow
          icon="layers"
          title={L('طلبات الخدمات', 'Service orders')}
          subtitle={L('مونتاج وتصميم وفيديو ونصوص وصوت', 'Editing, design, video, copy and voice')}
          onPress={() => router.push('/jobs')}
        />
        <ListRow
          icon="wallet"
          title={L('الأسعار والأرباح', 'Prices and margin')}
          subtitle={L('تكلفة كل أداة وسعر الدولار وهامش الربح', 'Tool costs, dollar rate and margin')}
          onPress={() => router.push('/pricing')}
        />
        <ListRow
          icon="sparkle"
          title={L('الذكاء الاصطناعي', 'AI')}
          subtitle={
            ai === 'online'
              ? L('مربوط عبر fal.ai', 'Connected through fal.ai')
              : ai === 'locked'
                ? L('يحتاج إلى رمز الوصول، أدخله أدناه', 'Needs the access code, enter it below')
                : ai === 'offline'
                  ? L('الخدمة غير متاحة الآن', 'Not available right now')
                  : L('جارٍ الفحص…', 'Checking…')
          }
          trailing={
            <Badge
              label={ai === 'online' ? L('متصل', 'Online') : ai === 'locked' ? L('مقفل', 'Locked') : ai === 'offline' ? L('غير متصل', 'Offline') : '…'}
              tone={ai === 'online' ? 'ok' : ai === 'locked' ? 'acc' : 'neutral'}
            />
          }
          onPress={() => router.push('/test-chat')}
          last
        />
      </Card>

      <SectionTitle title={accountType === 'creator' ? L('عن محتواك', 'About your content') : L('معلومات النشاط', 'About your business')} />
      <BusinessInfoCard creator={accountType === 'creator'} />

      <SectionTitle title={L('رمز الوصول', 'Access code')} />
      <AccessCodeCard />

      <SectionTitle title={L('الحسابات المربوطة', 'Linked accounts')} />
      <Card style={styles.list}>
        {linked.map((p, i) => (
          <ListRow
            key={p}
            leading={<PlatformTag platform={p} size={34} />}
            title={pick(platformNames[p])}
            subtitle={L('يُربط عند تشغيل الخادم في المرحلة الثانية', 'Links once the server runs, in phase two')}
            trailing={<Badge label={L('غير مربوط', 'Not linked')} />}
            last={i === linked.length - 1}
          />
        ))}
      </Card>

      <SectionTitle title={L('نوع الحساب', 'Account type')} />
      <Segmented<AccountType>
        options={[
          { value: 'shop', label: L('متجر أو مطعم', 'Shop or restaurant') },
          { value: 'creator', label: L('صانع محتوى', 'Creator') },
        ]}
        value={accountType ?? 'shop'}
        onChange={chooseAccountType}
      />

      <SectionTitle title={L('الألوان', 'Colors')} />
      <View accessibilityRole="radiogroup" style={styles.palettes}>
        {(Object.keys(palettes) as PaletteName[]).map((name) => {
          const p = palettes[name][scheme];
          const active = palette === name;
          return (
            <PressableScale
              key={name}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={pick(paletteNames[name])}
              onPress={() => setPalette(name)}
              style={[styles.palette, { backgroundColor: c.card, borderColor: active ? c.primary : c.line, borderWidth: active ? 1.5 : 1 }]}>
              <View style={[styles.preview, { backgroundColor: p.hero }]}>
                <View style={[styles.previewBtn, { backgroundColor: p.heroBtn }]} />
                <View style={styles.swatches}>
                  {[p.primary, p.chart, p.chartSoft, p.tile].map((col, i) => (
                    <View key={i} style={[styles.swatch, { backgroundColor: col }]} />
                  ))}
                </View>
              </View>
              <AppText weight={active ? 'semibold' : 'regular'} size={14} center>
                {pick(paletteNames[name])}
              </AppText>
            </PressableScale>
          );
        })}
      </View>

      <SectionTitle title={L('المظهر', 'Appearance')} />
      <Segmented<ThemePreference>
        options={[
          { value: 'system', label: L('تلقائي', 'Auto') },
          { value: 'light', label: L('فاتح', 'Light') },
          { value: 'dark', label: L('داكن', 'Dark') },
        ]}
        value={themePreference}
        onChange={setThemePreference}
      />

      <Button
        label={L('تسجيل الخروج', 'Sign out')}
        variant="secondary"
        icon="logout"
        style={styles.signOut}
        onPress={() => {
          signOut();
          router.replace('/auth');
        }}
      />
      <AppText size={11.5} color={c.placeholder} center>
        SQ AI {Constants.expoConfig?.version ?? ''} · {L('نسخة تجريبية', 'Test build')}
      </AppText>
    </ScrollScreen>
  );
}

// What the assistant knows about the business. It replies to customers and
// suggests ideas from this text only, so it never invents prices.
function BusinessInfoCard({ creator }: { creator: boolean }) {
  const { c } = useTheme();
  const { businessInfo, setBusinessInfo } = useSession();
  const { L, rtl } = useI18n();
  const [draft, setDraft] = useState(businessInfo);
  const [saved, setSaved] = useState(false);
  return (
    <Card>
      <AppText size={12.5} color={c.muted} lineHeight={19}>
        {creator
          ? L('اكتب مجالك وجمهورك ومدينتك وأسلوبك. يقترح المساعد الأفكار بناءً عليها.', 'Describe your niche, audience, city and style. The assistant suggests ideas from this.')
          : L(
              'اكتب أصنافك وأسعارها، ومناطق التوصيل وتكلفته، وأوقات العمل. يرد المساعد على العملاء من هذه المعلومات فقط.',
              'List your items and prices, delivery areas and fees, and opening hours. The assistant answers customers from this only.',
            )}
      </AppText>
      <TextInput
        value={draft}
        onChangeText={(v) => {
          setDraft(v);
          setSaved(false);
        }}
        multiline
        placeholder={
          creator
            ? L('مثال: محتوى عن الطعام والسفر في بغداد، وجمهوري بين 18 و30 سنة…', 'e.g. food and travel content in Baghdad, audience aged 18–30…')
            : L('مثال: شاورما لحم 5,000 د.ع، توصيل مجاني إلى المنصور، العمل من 12 ظهرًا حتى 12 ليلًا…', 'e.g. beef shawarma IQD 5,000, free delivery to Mansour, open 12 pm – 12 am…')
        }
        placeholderTextColor={c.placeholder}
        accessibilityLabel={creator ? L('عن محتواك', 'About your content') : L('معلومات النشاط', 'About your business')}
        style={[styles.infoInput, { color: c.text, backgroundColor: c.tile, borderColor: c.line, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }]}
      />
      <Button
        label={saved ? L('تم الحفظ', 'Saved') : L('احفظ', 'Save')}
        icon={saved ? 'check' : undefined}
        height={44}
        disabled={draft === businessInfo && !saved}
        onPress={() => {
          setBusinessInfo(draft);
          setSaved(true);
        }}
      />
    </Card>
  );
}

// The code the account owner shares with testers; it unlocks the hosted AI.
function AccessCodeCard() {
  const { c } = useTheme();
  const { accessCode, setAccessCode } = useSession();
  const { L } = useI18n();
  const [draft, setDraft] = useState(accessCode);
  const [saved, setSaved] = useState(false);
  const changed = draft.trim() !== accessCode;
  return (
    <Card>
      <AppText size={12.5} color={c.muted} lineHeight={19}>
        {L(
          'الذكاء الاصطناعي محمي برمز يعطيك إياه صاحب الحساب. اكتبه مرة واحدة ويُحفظ على هذا الجهاز.',
          'AI is protected by a code from the account owner. Enter it once and it stays on this device.',
        )}
      </AppText>
      <TextInput
        value={draft}
        onChangeText={(v) => {
          setDraft(v);
          setSaved(false);
        }}
        placeholder={L('مثال: SQ-XXXX-XXXX', 'e.g. SQ-XXXX-XXXX')}
        placeholderTextColor={c.placeholder}
        autoCapitalize="characters"
        autoCorrect={false}
        accessibilityLabel={L('رمز الوصول', 'Access code')}
        style={[styles.codeInput, { color: c.text, backgroundColor: c.tile, borderColor: c.line }]}
      />
      <Button
        label={saved ? L('تم الحفظ', 'Saved') : L('احفظ الرمز', 'Save code')}
        icon={saved ? 'check' : undefined}
        height={44}
        disabled={!changed && !saved}
        onPress={() => {
          setAccessCode(draft);
          setSaved(true);
        }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ltr: { writingDirection: 'ltr', alignSelf: 'flex-start' },
  list: { paddingVertical: 2, gap: 0 },
  signOut: { marginTop: 16 },
  infoInput: { minHeight: 120, borderRadius: 12, borderWidth: 1, padding: 12, fontFamily: 'ReadexPro_400Regular', fontSize: 14, lineHeight: 22, textAlignVertical: 'top' },
  codeInput: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontFamily: 'ReadexPro_500Medium', fontSize: 15, textAlign: 'left', writingDirection: 'ltr', letterSpacing: 1 },
  palettes: { flexDirection: 'row', gap: 10 },
  palette: { flex: 1, borderRadius: 14, padding: 8, gap: 8 },
  preview: { height: 72, borderRadius: 9, padding: 10, justifyContent: 'space-between' },
  previewBtn: { width: 44, height: 12, borderRadius: 4 },
  swatches: { flexDirection: 'row', gap: 5 },
  swatch: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
});
