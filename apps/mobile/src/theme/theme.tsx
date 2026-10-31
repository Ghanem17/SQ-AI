import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { themes, type ColorTokens, type SchemeName } from '@sq/shared';
import { useSession } from '@/state/session';

type Theme = { scheme: SchemeName; c: ColorTokens };

const ThemeContext = createContext<Theme>({ scheme: 'light', c: themes.light });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const { themePreference } = useSession();
  const scheme: SchemeName =
    themePreference === 'system' ? (system === 'dark' ? 'dark' : 'light') : themePreference;
  return <ThemeContext.Provider value={{ scheme, c: themes[scheme] }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
