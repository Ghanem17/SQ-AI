import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme, type ViewStyle } from 'react-native';

import { palettes, type ColorTokens, type PaletteName, type SchemeName } from '@sq/shared';
import { useSession } from '@/state/session';

export type Elevation = 'card' | 'raised' | 'fab';
type Theme = { scheme: SchemeName; palette: PaletteName; c: ColorTokens; dark: boolean; elev: Record<Elevation, ViewStyle> };

function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// Light themes lift cards with a soft shadow; dark themes rely on the line
// border alone. Buttons never carry a shadow.
function elevations(c: ColorTokens, dark: boolean): Record<Elevation, ViewStyle> {
  if (dark) return { card: {}, raised: {}, fab: { boxShadow: `0px 8px 18px ${rgba(c.shadow, 0.4)}` } };
  return {
    card: { boxShadow: `0px 1px 2px ${rgba(c.shadow, 0.04)}, 0px 4px 14px ${rgba(c.shadow, 0.045)}` },
    raised: { boxShadow: `0px 3px 10px ${rgba(c.shadow, 0.08)}` },
    fab: { boxShadow: `0px 8px 18px ${rgba(c.shadow, 0.28)}` },
  };
}

const fallback = palettes.ocean.light;
const ThemeContext = createContext<Theme>({ scheme: 'light', palette: 'ocean', c: fallback, dark: false, elev: elevations(fallback, false) });

// Colors come from the chosen palette (ocean or rose) in the chosen mode.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const { themePreference, palette } = useSession();
  const scheme: SchemeName = themePreference === 'system' ? (system === 'dark' ? 'dark' : 'light') : themePreference;
  const chosen = palettes[palette] ?? palettes.ocean;
  const c = chosen[scheme];
  const dark = scheme === 'dark';
  return <ThemeContext.Provider value={{ scheme, palette, c, dark, elev: elevations(c, dark) }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
