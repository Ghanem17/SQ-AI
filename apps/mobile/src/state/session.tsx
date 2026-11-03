import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { AccountType, PaletteName, ThemePreference } from '@sq/shared';
import { setAccessCode as setClientAccessCode } from '@/lib/access';

type SessionData = {
  onboarded: boolean;
  signedIn: boolean;
  displayName: string | null;
  phone: string | null;
  accountType: AccountType | null;
  themePreference: ThemePreference;
  palette: PaletteName;
  // Code from the account owner that unlocks the hosted AI for testers.
  accessCode: string;
};

type Session = SessionData & {
  ready: boolean;
  completeOnboarding: () => void;
  signIn: (phone: string, displayName: string | null) => void;
  chooseAccountType: (type: AccountType) => void;
  setThemePreference: (pref: ThemePreference) => void;
  setPalette: (palette: PaletteName) => void;
  setAccessCode: (code: string) => void;
  signOut: () => void;
};

const STORAGE_KEY = 'sq.session.v1';

const initial: SessionData = {
  onboarded: false,
  signedIn: false,
  displayName: null,
  phone: null,
  accountType: null,
  themePreference: 'system',
  palette: 'ocean',
  accessCode: '',
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SessionData>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!cancelled && raw) setData({ ...initial, ...(JSON.parse(raw) as Partial<SessionData>) });
      })
      // A corrupt or unreadable store starts a fresh session instead of blocking the app.
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The AI client sends the code with every request.
  useEffect(() => {
    setClientAccessCode(data.accessCode);
  }, [data.accessCode]);

  // Persist after hydration only, so the empty initial state never overwrites a saved session.
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => undefined);
  }, [data, ready]);

  const update = (patch: Partial<SessionData>) => setData((prev) => ({ ...prev, ...patch }));

  const value: Session = {
    ...data,
    ready,
    completeOnboarding: () => update({ onboarded: true }),
    signIn: (phone, displayName) => update({ signedIn: true, phone, displayName }),
    chooseAccountType: (accountType) => update({ accountType }),
    setThemePreference: (themePreference) => update({ themePreference }),
    setPalette: (palette) => update({ palette }),
    setAccessCode: (accessCode) => update({ accessCode: accessCode.trim() }),
    signOut: () => update({ signedIn: false, phone: null, displayName: null, accountType: null }),
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside SessionProvider');
  return session;
}
