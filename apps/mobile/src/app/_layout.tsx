import {
  ReadexPro_400Regular,
  ReadexPro_500Medium,
  ReadexPro_600SemiBold,
  ReadexPro_700Bold,
  useFonts,
} from '@expo-google-fonts/readex-pro';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nManager, Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useI18n } from '@/i18n';
import { SessionProvider, useSession } from '@/state/session';
import { StudioProvider } from '@/state/studio';
import { ServicesProvider } from '@/features/services/store';
import { ThemeProvider, useTheme } from '@/theme/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Keep left/right physical everywhere; layouts use start/end or measured
// positions for anything that depends on reading direction.
if (Platform.OS !== 'web') I18nManager.swapLeftAndRightInRTL(false);

// The web preview has no native RTL switch; native builds force RTL through
// the expo-localization config plugin.
if (Platform.OS === 'web' && !I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ReadexPro_400Regular,
    ReadexPro_500Medium,
    ReadexPro_600SemiBold,
    ReadexPro_700Bold,
  });

  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider>
        <SessionProvider>
          <StudioProvider>
            <ServicesProvider>
              <ThemeProvider>
                <AppShell fontsReady={fontsLoaded || fontError != null} />
              </ThemeProvider>
            </ServicesProvider>
          </StudioProvider>
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppShell({ fontsReady }: { fontsReady: boolean }) {
  const { c, scheme } = useTheme();
  const session = useSession();
  const { rtl } = useI18n();
  const ready = fontsReady && session.ready;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <View style={[styles.fill, { direction: rtl ? 'rtl' : 'ltr', backgroundColor: c.bg }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: rtl ? 'slide_from_left' : 'slide_from_right' }}>
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="auth" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="assistant" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="capture" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="order" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="reel/receipt" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
