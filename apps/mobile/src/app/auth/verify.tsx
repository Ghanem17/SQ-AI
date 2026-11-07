import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Monogram } from '@/components/brand';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/ui';
import { OtpBlock } from '@/features/auth/OtpBlock';
import { useI18n } from '@/i18n';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/theme';

// The code step on its own page, for links that still open it. Sign-in now
// shows the same block inline.
export default function VerifyScreen() {
  const { c } = useTheme();
  const { t } = useI18n();
  const { phone, display, mode, name, accountType: pickedType } = useLocalSearchParams<{ phone: string; display: string; mode: string; name?: string; accountType?: string }>();
  const { signIn, accountType, chooseAccountType } = useSession();

  const verified = () => {
    signIn(phone, mode === 'signUp' && name ? name : null);
    // New accounts chose their type on the sign-up form.
    if (mode === 'signUp' && (pickedType === 'shop' || pickedType === 'creator')) {
      chooseAccountType(pickedType);
      router.replace('/');
    } else {
      router.replace(accountType ? '/' : '/auth/account-type');
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar title={t.verify.codeLabel} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Monogram size={44} />
        <View style={styles.head}>
          <AppText variant="h1">{t.verify.title}</AppText>
          <AppText variant="body" color={c.muted}>
            {t.verify.sentTo(display ?? phone)}
          </AppText>
        </View>
        <OtpBlock phone={phone} display={display ?? phone} onVerified={verified} onChangeNumber={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 18 },
  head: { gap: 4 },
});
