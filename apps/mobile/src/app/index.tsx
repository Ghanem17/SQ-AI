import { Redirect } from 'expo-router';

import { useSession } from '@/state/session';

// Sends each person to the first step they have not finished yet.
export default function Index() {
  const { onboarded, signedIn, accountType } = useSession();
  if (!onboarded) return <Redirect href="/onboarding" />;
  if (!signedIn) return <Redirect href="/auth" />;
  if (!accountType) return <Redirect href="/auth/account-type" />;
  return <Redirect href="/(tabs)" />;
}
