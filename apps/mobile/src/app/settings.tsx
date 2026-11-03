import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { formatIQD, paletteNames, palettes, platformNames, tiers, type AccountType, type PaletteName, type Platform, type ThemePreference } from '@sq/shared';
import { PressableScale } from '@/components/PressableScale';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Avatar, Badge, Card, ListRow, PlatformTag, ScrollScreen, SectionTitle, Segmented, TopBar, ui } from '@/components/ui';
import { useAiStatus } from '@/lib/ai';
import { useSession } from '@/state/session';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

const linked: Platform[] = ['instagram', 'facebook', 'tiktok', 'whatsapp'];

export default function SettingsScreen() {
  const { c, scheme } = useTheme();
  const { themePreference, setThemePreference, palette, setPalette, signOut, displayName, phone, accountType, chooseAccountType } = useSession();
  const { plan, automation, orders } = useStudio();
  const ai = useAiStatus();
  const name = displayName ?? 'حسابي';

  return (
    <ScrollScreen header={<TopBar title="الحساب والإعدادات" />}>
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
        <Badge label={accountType === 'creator' ? 'صانع محتوى' : 'متجر أو مطعم'} tone="pri" />
      </Card>

      <SectionTitle title="الاشتراك والتشغيل" />
      <Card style={styles.list}>
        <ListRow
          icon="calendar"
          title="الخطة الشهرية"
          subtitle={plan.active ? `${plan.reels} ريلز · ${tiers[plan.tier].name}` : 'غير مفعّلة'}
          onPress={() => router.push('/plan')}
        />
        <ListRow
          icon="bolt"
          title="الوضع التلقائي"
          subtitle={automation.enabled ? `يعمل · سقف ${formatIQD(automation.monthlyCap)}` : 'متوقف'}
          onPress={() => router.push('/automation')}
        />
        <ListRow icon="receipt" title="الطلبات" subtitle={orders.length ? `${orders.length} طلبات في هذا الجهاز` : 'لا توجد طلبات بعد'} />
        <ListRow icon="layers" title="طلبات الخدمات" subtitle="مونتاج، تصميم، فيديو، نصوص وصوت" onPress={() => router.push('/jobs')} />
        <ListRow icon="wallet" title="الأسعار والأرباح" subtitle="كلفة كل أداة، سعر الدولار وهامش الربح" onPress={() => router.push('/pricing')} />
        <ListRow
          icon="sparkle"
          title="الذكاء الاصطناعي"
          subtitle={
            ai === 'online' ? 'مربوط عبر fal.ai' : ai === 'locked' ? 'يحتاج رمز الوصول، أدخله تحت' : ai === 'offline' ? 'الخدمة غير متاحة الآن' : 'جارٍ الفحص…'
          }
          trailing={
            <Badge
              label={ai === 'online' ? 'متصل' : ai === 'locked' ? 'مقفل' : ai === 'offline' ? 'غير متصل' : '…'}
              tone={ai === 'online' ? 'ok' : ai === 'locked' ? 'acc' : 'neutral'}
            />
          }
          onPress={() => router.push('/test-chat')}
          last
        />
      </Card>

      <SectionTitle title={accountType === 'creator' ? 'عن محتواك' : 'معلومات المحل'} />
      <BusinessInfoCard creator={accountType === 'creator'} />

      <SectionTitle title="رمز الوصول" />
      <AccessCodeCard />

      <SectionTitle title="الحسابات المربوطة" />
      <Card style={styles.list}>
        {linked.map((p, i) => (
          <ListRow
            key={p}
            leading={<PlatformTag platform={p} size={34} />}
            title={platformNames[p]}
            subtitle="يُربط عند تشغيل السيرفر في المرحلة الثانية"
            trailing={<Badge label="غير مربوط" />}
            last={i === linked.length - 1}
          />
        ))}
      </Card>

      <SectionTitle title="نوع الحساب" />
      <Segmented<AccountType>
        options={[
          { value: 'shop', label: 'متجر أو مطعم' },
          { value: 'creator', label: 'صانع محتوى' },
        ]}
        value={accountType ?? 'shop'}
        onChange={chooseAccountType}
      />

      <SectionTitle title="الألوان" />
      <View accessibilityRole="radiogroup" style={styles.palettes}>
        {(Object.keys(palettes) as PaletteName[]).map((name) => {
          const p = palettes[name][scheme];
          const active = palette === name;
          return (
            <PressableScale
              key={name}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={paletteNames[name]}
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
                {paletteNames[name]}
              </AppText>
            </PressableScale>
          );
        })}
      </View>

      <SectionTitle title="المظهر" />
      <Segmented<ThemePreference>
        options={[
          { value: 'system', label: 'تلقائي' },
          { value: 'light', label: 'فاتح' },
          { value: 'dark', label: 'داكن' },
        ]}
        value={themePreference}
        onChange={setThemePreference}
      />

      <Button
        label="تسجيل الخروج"
        variant="secondary"
        icon="logout"
        style={styles.signOut}
        onPress={() => {
          signOut();
          router.replace('/auth');
        }}
      />
      <AppText size={11.5} color={c.placeholder} center>
        SQ AI {Constants.expoConfig?.version ?? ''} · نسخة تجريبية
      </AppText>
    </ScrollScreen>
  );
}

// What the assistant knows about the business. It replies to customers and
// suggests ideas from this text only, so it never invents prices.
function BusinessInfoCard({ creator }: { creator: boolean }) {
  const { c } = useTheme();
  const { businessInfo, setBusinessInfo } = useSession();
  const [draft, setDraft] = useState(businessInfo);
  const [saved, setSaved] = useState(false);
  return (
    <Card>
      <AppText size={12.5} color={c.muted} lineHeight={19}>
        {creator
          ? 'اكتب مجالك وجمهورك ومدينتك وأسلوبك. المساعد يقترح الأفكار على أساسها.'
          : 'اكتب أصنافك وأسعارها، ومناطق التوصيل وكلفته، وأوقات الدوام. المساعد يرد على الزبائن من هذه المعلومات فقط.'}
      </AppText>
      <TextInput
        value={draft}
        onChangeText={(v) => {
          setDraft(v);
          setSaved(false);
        }}
        multiline
        placeholder={creator ? 'مثال: محتوى أكل وسفر في بغداد، جمهوري 18–30 سنة…' : 'مثال: شاورما لحم 5,000 د.ع، توصيل مجاني للمنصور، الدوام 12 ظهرًا – 12 ليلًا…'}
        placeholderTextColor={c.placeholder}
        accessibilityLabel={creator ? 'عن محتواك' : 'معلومات المحل'}
        style={[styles.infoInput, { color: c.text, backgroundColor: c.tile, borderColor: c.line }]}
      />
      <Button
        label={saved ? 'تم الحفظ' : 'احفظ'}
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
  const [draft, setDraft] = useState(accessCode);
  const [saved, setSaved] = useState(false);
  const changed = draft.trim() !== accessCode;
  return (
    <Card>
      <AppText size={12.5} color={c.muted} lineHeight={19}>
        الذكاء الاصطناعي محمي برمز يعطيك إياه صاحب الحساب. اكتبه مرة واحدة ويُحفظ على هذا الجهاز.
      </AppText>
      <TextInput
        value={draft}
        onChangeText={(v) => {
          setDraft(v);
          setSaved(false);
        }}
        placeholder="مثال: SQ-XXXX-XXXX"
        placeholderTextColor={c.placeholder}
        autoCapitalize="characters"
        autoCorrect={false}
        accessibilityLabel="رمز الوصول"
        style={[styles.codeInput, { color: c.text, backgroundColor: c.tile, borderColor: c.line }]}
      />
      <Button
        label={saved ? 'تم الحفظ' : 'احفظ الرمز'}
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
  infoInput: { minHeight: 120, borderRadius: 12, borderWidth: 1, padding: 12, fontFamily: 'ReadexPro_400Regular', fontSize: 14, lineHeight: 22, textAlign: 'right', textAlignVertical: 'top', writingDirection: 'rtl' },
  codeInput: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontFamily: 'ReadexPro_500Medium', fontSize: 15, textAlign: 'left', writingDirection: 'ltr', letterSpacing: 1 },
  palettes: { flexDirection: 'row', gap: 10 },
  palette: { flex: 1, borderRadius: 14, padding: 8, gap: 8 },
  preview: { height: 72, borderRadius: 9, padding: 10, justifyContent: 'space-between' },
  previewBtn: { width: 44, height: 12, borderRadius: 4 },
  swatches: { flexDirection: 'row', gap: 5 },
  swatch: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
});
