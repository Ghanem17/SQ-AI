import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { palettes, type ColorTokens, type PaletteName, type SchemeName } from '@sq/shared';
import { useSession } from '@/state/session';

type Theme = { scheme: SchemeName; palette: PaletteName; c: ColorTokens };

const ThemeContext = createContext<Theme>({ scheme: 'light', palette: 'ocean', c: palettes.ocean.light });

// Colors come from the chosen palette (ocean or rose) in the chosen mode.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const { themePreference, palette } = useSession();
  const scheme: SchemeName =
    themePreference === 'system' ? (system === 'dark' ? 'dark' : 'light') : themePreference;
  const chosen = palettes[palette] ?? palettes.ocean;
  return <ThemeContext.Provider value={{ scheme, palette, c: chosen[scheme] }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
