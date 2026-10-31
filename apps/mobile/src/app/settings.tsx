import Constants from 'expo-constants';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatIQD, platformNames, tiers, type AccountType, type Platform, type ThemePreference } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Avatar, Badge, Card, ListRow, PlatformTag, ScrollScreen, SectionTitle, Segmented, TopBar, ui } from '@/components/ui';
import { useSession } from '@/state/session';
import { useStudio } from '@/state/studio';
import { useTheme } from '@/theme/theme';

const linked: Platform[] = ['instagram', 'facebook', 'tiktok', 'whatsapp'];

export default function SettingsScreen() {
  const { c } = useTheme();
  const { themePreference, setThemePreference, signOut, displayName, phone, accountType, chooseAccountType } = useSession();
  const { plan, automation, orders } = useStudio();
  const name = displayName ?? (accountType === 'creator' ? 'نور' : 'مطعم بيت الريف');

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
        <ListRow icon="receipt" title="الطلبات" subtitle={orders.length ? `${orders.length} طلبات في هذا الجهاز` : 'لا توجد طلبات بعد'} last />
      </Card>

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

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ltr: { writingDirection: 'ltr', alignSelf: 'flex-start' },
  list: { paddingVertical: 2, gap: 0 },
  signOut: { marginTop: 16 },
});
