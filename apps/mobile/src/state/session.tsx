import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { setCurrencyLang, type AccountType, type PaletteName, type ThemePreference } from '@sq/shared';
import { setAccessCode as setClientAccessCode } from '@/lib/access';

type SessionData = {
  onboarded: boolean;
  signedIn: boolean;
  displayName: string | null;
  phone: string | null;
  accountType: AccountType | null;
  themePreference: ThemePreference;
  palette: PaletteName;
  // Interface language; Arabic lays screens out right to left.
  lang: 'ar' | 'en';
  // Code from the account owner that unlocks the hosted AI for testers.
  accessCode: string;
  // What the business sells, prices, areas and hours, in the owner's words.
  // The assistant answers customers from this and nothing else.
  businessInfo: string;
};

type Session = SessionData & {
  ready: boolean;
  completeOnboarding: () => void;
  signIn: (phone: string, displayName: string | null) => void;
  chooseAccountType: (type: AccountType) => void;
  setThemePreference: (pref: ThemePreference) => void;
  setPalette: (palette: PaletteName) => void;
  setLang: (lang: 'ar' | 'en') => void;
  setAccessCode: (code: string) => void;
  setBusinessInfo: (info: string) => void;
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
  lang: 'ar',
  accessCode: '',
  businessInfo: '',
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

  setCurrencyLang(data.lang);

  const update = (patch: Partial<SessionData>) => setData((prev) => ({ ...prev, ...patch }));

  const value: Session = {
    ...data,
    ready,
    completeOnboarding: () => update({ onboarded: true }),
    signIn: (phone, displayName) => update({ signedIn: true, phone, displayName }),
    chooseAccountType: (accountType) => update({ accountType }),
    setThemePreference: (themePreference) => update({ themePreference }),
    setPalette: (palette) => update({ palette }),
    setLang: (lang) => update({ lang }),
    setAccessCode: (accessCode) => update({ accessCode: accessCode.trim() }),
    setBusinessInfo: (businessInfo) => update({ businessInfo: businessInfo.slice(0, 2000) }),
    signOut: () => update({ signedIn: false, phone: null, displayName: null, accountType: null, businessInfo: '' }),
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside SessionProvider');
  return session;
}
