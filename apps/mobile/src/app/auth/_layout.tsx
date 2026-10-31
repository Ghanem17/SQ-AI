import { Stack } from 'expo-router';

import { useTheme } from '@/theme/theme';

export default function AuthLayout() {
  const { c } = useTheme();
  return <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom', contentStyle: { backgroundColor: c.bg } }} />;
}
