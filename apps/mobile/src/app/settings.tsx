import { Redirect } from 'expo-router';

// Settings moved into the Account tab; old links land there.
export default function SettingsRedirect() {
  return <Redirect href="/account" />;
}
