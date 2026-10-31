import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { radius, type ThemePreference } from '@sq/shared';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { ar } from '@/i18n/ar';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/theme';

const t = ar.comingSoon;
const prefs: ThemePreference[] = ['system', 'light', 'dark'];

export default function SettingsScreen() {
  const { c } = useTheme();
  const { themePreference, setThemePreference, signOut, displayName, phone } = useSession();

  return (
    <Screen edges={['top', 'bottom']} style={styles.body}>
      <View style={styles.header}>
        <AppText weight="semibold" size={24}>
          {ar.today.account}
        </AppText>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={ar.common.back}
          onPress={() => router.back()}
          style={[styles.close, { backgroundColor: c.tile }]}>
          <Icon name="close" color={c.text} size={20} strokeWidth={2} />
        </PressableScale>
      </View>

      {(displayName || phone) && (
        <View style={[styles.tile, { backgroundColor: c.tile }]}>
          {displayName && (
            <AppText weight="semibold" size={17}>
              {displayName}
            </AppText>
          )}
          {phone && (
            <AppText size={14} color={c.muted} style={styles.ltr}>
              {phone}
            </AppText>
          )}
        </View>
      )}

      <View style={[styles.tile, { backgroundColor: c.tile }]}>
        <AppText weight="medium" size={14} color={c.muted}>
          {t.theme}
        </AppText>
        <View accessibilityRole="radiogroup" style={styles.prefs}>
          {prefs.map((p) => {
            const active = p === themePreference;
            return (
              <PressableScale
                key={p}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => setThemePreference(p)}
                style={[styles.pref, { backgroundColor: active ? c.primary : c.bg }]}>
                <AppText weight="semibold" size={14} color={active ? c.onPrimary : c.text}>
                  {t.themes[p]}
                </AppText>
              </PressableScale>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          label={t.signOut}
          variant="outline"
          onPress={() => {
            signOut();
            router.replace('/auth');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 6 },
  close: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tile: { borderRadius: radius.tile, padding: 18, gap: 10 },
  ltr: { writingDirection: 'ltr', alignSelf: 'flex-start' },
  prefs: { flexDirection: 'row', gap: 8 },
  pref: { flex: 1, height: 46, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  footer: { marginTop: 'auto', paddingBottom: 8 },
});
