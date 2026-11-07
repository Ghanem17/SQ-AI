import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatE164, formatIQD, formatNumber, paletteNames, palettes, platformNames, tiers, type AccountType, type PaletteName, type Platform, type ThemePreference } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PressableScale } from '@/components/PressableScale';
import { Avatar, Badge, Card, Field, GroupLabel, IconBadge, ListCard, ListRow, PageTitle, PlatformTag, ScrollScreen, Segmented } from '@/components/ui';
import { useServices } from '@/features/services/store';
import { useI18n } from '@/i18n';
import { useAiStatus } from '@/lib/ai';
import { useSession } from '@/state/session';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

const linked: Platform[] = ['instagram', 'facebook', 'tiktok', 'whatsapp'];

// The swatch that stands for each palette in the picker.
const swatch: Record<PaletteName, string> = { ocean: palettes.ocean.light.primary, rose: palettes.rose.dark.primary };

// Account and settings, grouped like a statement: appearance and language,
// the business, plans and automation, the owner's prices, linked accounts.
export default function AccountTab() {
  const { c, dark } = useTheme();
  const { themePreference, setThemePreference, palette, setPalette, signOut, displayName, phone, accountType, chooseAccountType, lang, setLang, businessInfo, accessCode } = useSession();
  const { L, pick, n } = useI18n();
  const { plan, automation, orders } = useStudio();
  const { jobs, settings } = useServices();
  const ai = useAiStatus();
  const [editing, setEditing] = useState<'info' | 'code' | null>(null);
  const [confirmOut, setConfirmOut] = useState(false);
  const name = displayName ?? L('حسابي', 'My account');
  const creator = accountType === 'creator';
  const toggle = (k: 'info' | 'code') => setEditing((e) => (e === k ? null : k));

  return (
    <ScrollScreen inTabs>
      <PageTitle title={L('حسابي', 'Account')} />

      <Card style={styles.profile}>
        <Avatar name={name} size={52} hero />
        <View style={styles.flex}>
          <AppText weight="bold" size={16} lineHeight={23} numberOfLines={2}>
            {name}
          </AppText>
          {phone && (
            <AppText variant="small" color={c.muted} numberOfLines={1} style={styles.ltr}>
              {`\u2066${formatE164(phone)}\u2069`}
            </AppText>
          )}
          <Badge
            icon={creator ? 'video' : 'store'}
            label={creator ? L('صانع محتوى', 'Creator') : L('متجر أو مطعم', 'Shop or restaurant')}
            tone="pri"
            style={styles.profileBadge}
          />
        </View>
      </Card>

      <GroupLabel title={L('المظهر واللغة', 'Appearance and language')} />
      <ListCard>
        <ListRow compact icon="globe" title={L('اللغة', 'Language')} value={lang === 'ar' ? 'العربية' : 'English'} onPress={() => setLang(lang === 'ar' ? 'en' : 'ar')} />
        <View style={[styles.row, { borderBottomColor: c.line }]}>
          <IconBadge icon="palette" size={34} />
          <AppText weight="medium" size={14} lineHeight={21} style={styles.flex}>
            {L('لوحة الألوان', 'Palette')}
          </AppText>
          <View accessibilityRole="radiogroup" style={styles.swatches}>
            {(Object.keys(palettes) as PaletteName[]).map((p) => {
              const active = palette === p;
              return (
                <PressableScale
                  key={p}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={pick(paletteNames[p])}
                  onPress={() => setPalette(p)}
                  style={[styles.swatchHit, active && { borderColor: c.primary }]}>
                  <View style={[styles.swatch, { backgroundColor: swatch[p], borderColor: dark ? 'rgba(255,255,255,0.28)' : 'transparent' }]} />
                </PressableScale>
              );
            })}
          </View>
          <AppText variant="small" color={c.muted}>
            {pick(paletteNames[palette])}
          </AppText>
        </View>
        <View style={[styles.row, styles.last]}>
          <IconBadge icon="moon" size={34} />
          <AppText weight="medium" size={14} lineHeight={21} style={styles.flex}>
            {L('المظهر', 'Appearance')}
          </AppText>
          <Segmented<ThemePreference>
            compact
            options={[
              { value: 'light', label: L('فاتح', 'Light') },
              { value: 'dark', label: L('داكن', 'Dark') },
              { value: 'system', label: L('تلقائي', 'Auto') },
            ]}
            value={themePreference}
            onChange={setThemePreference}
          />
        </View>
      </ListCard>

      <GroupLabel title={creator ? L('المحتوى', 'Content') : L('النشاط', 'Business')} />
      <ListCard>
        <ListRow
          compact
          icon="doc"
          title={creator ? L('عن محتواك', 'About your content') : L('معلومات النشاط', 'Business details')}
          value={businessInfo.trim() ? businessInfo.trim().split('\n')[0] : L('غير مضافة', 'Not added')}
          onPress={() => toggle('info')}
        />
        <ListRow
          compact
          icon="key"
          title={L('رمز الوصول', 'Access code')}
          trailing={
            !accessCode ? (
              <Badge label={L('غير مضاف', 'Not added')} />
            ) : ai === 'online' ? (
              <Badge label={L('مفعّل', 'Active')} tone="ok" />
            ) : ai === 'locked' ? (
              <Badge label={L('غير صحيح', 'Not valid')} tone="bad" />
            ) : ai === 'offline' ? (
              <Badge label={L('غير متصل', 'Offline')} />
            ) : (
              <Badge label={L('جارٍ الفحص', 'Checking')} />
            )
          }
          onPress={() => toggle('code')}
        />
        <View style={[styles.row, styles.last]}>
          <IconBadge icon="store" size={34} />
          <AppText weight="medium" size={14} lineHeight={21} style={styles.flex}>
            {L('نوع الحساب', 'Account type')}
          </AppText>
          <Segmented<AccountType>
            compact
            options={[
              { value: 'shop', label: L('متجر', 'Shop') },
              { value: 'creator', label: L('صانع محتوى', 'Creator') },
            ]}
            value={accountType ?? 'shop'}
            onChange={chooseAccountType}
          />
        </View>
      </ListCard>
      {editing === 'info' && <BusinessInfoCard creator={creator} onDone={() => setEditing(null)} />}
      {editing === 'code' && <AccessCodeCard onDone={() => setEditing(null)} />}

      <GroupLabel title={L('الاشتراك والتشغيل', 'Plan and automation')} />
      <ListCard>
        <ListRow
          compact
          icon="calendar"
          title={L('الخطة الشهرية', 'Monthly plan')}
          value={plan.active ? `${n(plan.reels, 'reel')} · ${pick(tiers[plan.tier].name)}` : L('غير مفعّلة', 'Off')}
          onPress={() => router.push('/plan')}
        />
        <ListRow
          compact
          icon="bolt"
          title={L('الوضع التلقائي', 'Autopilot')}
          value={automation.enabled ? L(`يعمل · ${formatIQD(automation.monthlyCap)}`, `On · ${formatIQD(automation.monthlyCap)}`) : L('متوقف', 'Off')}
          onPress={() => router.push('/automation')}
        />
        <ListRow
          compact
          icon="layers"
          title={L('طلبات الخدمات', 'Service orders')}
          value={jobs.length ? formatNumber(jobs.length) : L('لا يوجد', 'None')}
          onPress={() => router.push('/jobs')}
        />
        <ListRow compact icon="video" title={L('طلبات الريلز', 'Reel orders')} value={orders.length ? formatNumber(orders.length) : L('لا يوجد', 'None')} chevron={false} />
        <ListRow
          compact
          icon="sparkle"
          title={L('الذكاء الاصطناعي', 'AI')}
          trailing={
            <Badge
              label={ai === 'online' ? L('متصل', 'Online') : ai === 'locked' ? L('مقفل', 'Locked') : ai === 'offline' ? L('غير متصل', 'Offline') : L('جارٍ الفحص', 'Checking')}
              tone={ai === 'online' ? 'ok' : ai === 'locked' ? 'acc' : 'neutral'}
            />
          }
          onPress={() => router.push('/test-chat')}
          last
        />
      </ListCard>

      <GroupLabel title={L('الإدارة', 'Admin')} badge={<Badge small label={L('للمدير', 'Owner')} tone="acc" />} />
      <ListCard>
        <ListRow
          compact
          icon="coins"
          iconTone="acc"
          title={L('الأسعار والأرباح', 'Prices and margin')}
          value={L(`هامش ${Math.round(settings.markup * 100)}% · ${formatNumber(settings.usdToIqd)} د.ع/$`, `${Math.round(settings.markup * 100)}% · ${formatNumber(settings.usdToIqd)}/$`)}
          onPress={() => router.push('/pricing')}
          last
        />
      </ListCard>

      <GroupLabel title={L('الحسابات المربوطة', 'Linked accounts')} />
      <ListCard>
        {linked.map((p, i) => (
          <ListRow
            key={p}
            compact
            leading={<PlatformTag platform={p} size={34} />}
            title={pick(platformNames[p])}
            trailing={<Badge label={L('غير مربوط', 'Not linked')} />}
            last={i === linked.length - 1}
          />
        ))}
      </ListCard>
      <AppText size={11.5} lineHeight={17} color={c.placeholder} style={styles.caption}>
        {L('يُفعَّل الربط عند تشغيل الخادم في المرحلة الثانية.', 'Linking turns on once the server runs, in phase two.')}
      </AppText>

      <Button
        label={L('تسجيل الخروج', 'Sign out')}
        variant="danger"
        icon="logout"
        style={styles.signOut}
        onPress={() => setConfirmOut(true)}
      />
      <ConfirmDialog
        visible={confirmOut}
        title={L('تسجيل الخروج؟', 'Sign out?')}
        body={L(
          'ستبقى معلومات نشاطك محفوظة على هذا الجهاز، وتعود عند الدخول بالرقم نفسه.',
          'Your business details stay on this device and come back when you sign in with the same number.',
        )}
        confirm={L('تسجيل الخروج', 'Sign out')}
        cancel={L('إلغاء', 'Cancel')}
        danger
        onCancel={() => setConfirmOut(false)}
        onConfirm={() => {
          setConfirmOut(false);
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
function BusinessInfoCard({ creator, onDone }: { creator: boolean; onDone: () => void }) {
  const { c } = useTheme();
  const { businessInfo, setBusinessInfo } = useSession();
  const { L } = useI18n();
  const [draft, setDraft] = useState(businessInfo);
  return (
    <Card>
      <AppText variant="small" lineHeight={19} color={c.muted}>
        {creator
          ? L('اكتب مجالك وجمهورك ومدينتك وأسلوبك. يقترح المساعد الأفكار بناءً عليها.', 'Describe your niche, audience, city and style. The assistant suggests ideas from this.')
          : L(
              'اكتب أصنافك وأسعارها، ومناطق التوصيل وتكلفته، وأوقات العمل. يرد المساعد على العملاء من هذه المعلومات فقط.',
              'List your items and prices, delivery areas and fees, and opening hours. The assistant answers customers from this only.',
            )}
      </AppText>
      <Field
        value={draft}
        onChangeText={setDraft}
        multiline
        autoFocus
        placeholder={
          creator
            ? L('مثال: محتوى عن الطعام والسفر في بغداد، وجمهوري بين 18 و30 سنة…', 'e.g. food and travel content in Baghdad, audience aged 18–30…')
            : L('مثال: شاورما لحم 5,000 د.ع، توصيل مجاني إلى المنصور، العمل من 12 ظهرًا حتى 12 ليلًا…', 'e.g. beef shawarma IQD 5,000, free delivery to Mansour, open 12 pm – 12 am…')
        }
        accessibilityLabel={creator ? L('عن محتواك', 'About your content') : L('معلومات النشاط', 'Business details')}
      />
      <View style={styles.actions}>
        <Button label={L('إلغاء', 'Cancel')} variant="secondary" height={44} style={styles.flex} onPress={onDone} />
        <Button
          label={L('احفظ', 'Save')}
          icon="check"
          height={44}
          style={styles.flex}
          disabled={draft === businessInfo}
          onPress={() => {
            setBusinessInfo(draft);
            onDone();
          }}
        />
      </View>
    </Card>
  );
}

// The code the account owner shares with testers; it unlocks the hosted AI.
function AccessCodeCard({ onDone }: { onDone: () => void }) {
  const { c } = useTheme();
  const { accessCode, setAccessCode } = useSession();
  const { L } = useI18n();
  const [draft, setDraft] = useState(accessCode);
  const changed = draft.trim() !== accessCode;
  return (
    <Card>
      <AppText variant="small" lineHeight={19} color={c.muted}>
        {L(
          'الذكاء الاصطناعي محمي برمز يعطيك إياه صاحب الحساب. اكتبه مرة واحدة ويُحفظ على هذا الجهاز.',
          'AI is protected by a code from the account owner. Enter it once and it stays on this device.',
        )}
      </AppText>
      <Field
        value={draft}
        onChangeText={setDraft}
        ltr
        autoFocus
        placeholder={L('مثال: SQ-XXXX-XXXX', 'e.g. SQ-XXXX-XXXX')}
        autoCapitalize="characters"
        autoCorrect={false}
        accessibilityLabel={L('رمز الوصول', 'Access code')}
      />
      <View style={styles.actions}>
        <Button label={L('إلغاء', 'Cancel')} variant="secondary" height={44} style={styles.flex} onPress={onDone} />
        <Button
          label={L('احفظ الرمز', 'Save code')}
          icon="check"
          height={44}
          style={styles.flex}
          disabled={!changed}
          onPress={() => {
            setAccessCode(draft);
            onDone();
          }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  ltr: { writingDirection: 'ltr', alignSelf: 'flex-start' },
  profileBadge: { marginTop: 6 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 8, paddingHorizontal: 14, borderBottomWidth: 1 },
  last: { borderBottomWidth: 0 },
  swatches: { flexDirection: 'row', gap: 4, direction: 'ltr' },
  swatchHit: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 18, height: 18, borderRadius: 9, borderWidth: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  caption: { paddingHorizontal: 4, marginTop: -4 },
  signOut: { marginTop: 8 },
});
