// Design tokens for SQ AI, taken from the approved formal redesign (v2).
// Every screen reads colors from these tokens, never from literals.

// The main palette (navy, sky, peach, orange), used on brand surfaces that
// look the same in every mode: onboarding, the camera, the logo.
export const brand = {
  navyDeep: '#0B132B',
  navy: '#1C2541',
  slate: '#3A506B',
  thumb: '#24304F',
  sky: '#5BC0DE',
  peach: '#F4D6B0',
  orange: '#D97706',
  light: '#F1F5F9',
  ivory: '#F5F2EC',
  // Muted text that stays readable on the navy surfaces.
  lightMuted: '#A9B8CC',
  green: '#3F5C4D',
  greenBrand: '#547564',
  greenLight: '#8FB9A2',
  sage: '#A9CDB7',
} as const;

export type ColorTokens = {
  // Page background: ivory for ocean, cool white for rose.
  bg: string;
  // Surface: cards, the tab bar and inputs, with a hairline border.
  card: string;
  // Alternate surface: segmented tracks, notes and quiet fills.
  tile: string;
  avatar: string;
  // Card borders and dividers.
  line: string;
  // Radio rings and secondary-button borders (3:1 on the surface).
  lineStrong: string;
  fieldLine: string;
  // Progress tracks and skeleton bars.
  track: string;
  // Chart grid lines.
  grid: string;
  text: string;
  muted: string;
  placeholder: string;
  // The deep hero surface: a 165° gradient from hero to heroAlt.
  hero: string;
  heroAlt: string;
  heroText: string;
  heroMuted: string;
  // Hairline rules and arcs on the hero (rgba).
  heroLine: string;
  // Monogram ring, progress fill and the bell dot on the hero.
  heroAccent: string;
  // Icon buttons and the period pill on the hero (rgba), and their border.
  heroTile: string;
  heroTileLine: string;
  // Delta badge on the hero; heroOkSoft is rgba.
  heroOk: string;
  heroOkSoft: string;
  // A button placed on the hero.
  heroBtn: string;
  heroBtnText: string;
  primary: string;
  onPrimary: string;
  // Icon-badge tint, info notes and model chips.
  priSoft: string;
  onPriSoft: string;
  // Graphic-only accent: tab indicator, active chart point, note stripe.
  // Never body text on a light surface.
  accent: string;
  // Accent text on accSoft.
  acc: string;
  accSoft: string;
  ok: string;
  okSoft: string;
  bad: string;
  badSoft: string;
  // "In progress" and other pending states.
  warn: string;
  warnSoft: string;
  // Main chart series, its area fill, and the second (dashed) series.
  chart: string;
  chartSoft: string;
  chart2: string;
  // Chart tooltip; inverted in dark mode so it stays visible.
  tooltip: string;
  onTooltip: string;
  nav: string;
  navText: string;
  navActive: string;
  // Kept for compatibility; the tab bar has no active pill.
  onNavActive: string;
  // The 22×2 bar above the active tab.
  navIndicator: string;
  // The centre action in the tab bar.
  fab: string;
  onFab: string;
  // Warm tile, kept for compatibility.
  sandTile: string;
  onSandTile: string;
  // Slate panel, kept for compatibility.
  greenTile: string;
  onGreenTile: string;
  // shadowColor for light-mode elevation.
  shadow: string;
};

// Ocean: navy carries text and actions on ivory; peach and amber are small
// accents only, and sky is used for data.
const oceanLight: ColorTokens = {
  bg: '#F5F2EC',
  card: '#FFFFFF',
  tile: '#EFEBE3',
  avatar: '#E6EDF3',
  line: '#E4DED3',
  lineStrong: '#8A93A3',
  fieldLine: '#8A93A3',
  track: '#E7E2D8',
  grid: '#ECE7DE',
  text: '#0B132B',
  muted: '#3A506B',
  placeholder: '#5D6A7E',
  hero: '#0B132B',
  heroAlt: '#1C2541',
  heroText: '#F5F2EC',
  heroMuted: '#A9B8CC',
  heroLine: 'rgba(244,214,176,0.24)',
  heroAccent: '#F4D6B0',
  heroTile: 'rgba(255,255,255,0.06)',
  heroTileLine: 'rgba(255,255,255,0.10)',
  heroOk: '#A9CDB7',
  heroOkSoft: 'rgba(169,205,183,0.14)',
  heroBtn: '#F4D6B0',
  heroBtnText: '#0B132B',
  primary: '#1C2541',
  onPrimary: '#FFFFFF',
  priSoft: '#E6F1F6',
  onPriSoft: '#1C2541',
  accent: '#D97706',
  acc: '#8F4E05',
  accSoft: '#FAEBD5',
  ok: '#2F5A43',
  okSoft: '#E5EEE8',
  bad: '#9E3B2F',
  badSoft: '#F7E6E2',
  warn: '#8F4E05',
  warnSoft: '#FAEBD5',
  chart: '#1C2541',
  chartSoft: '#5BC0DE',
  chart2: '#D97706',
  tooltip: '#0B132B',
  onTooltip: '#F5F2EC',
  nav: '#FFFFFF',
  navText: '#5D6A7E',
  navActive: '#0B132B',
  onNavActive: '#FFFFFF',
  navIndicator: '#D97706',
  fab: '#0B132B',
  onFab: '#F4D6B0',
  sandTile: '#FAEBD5',
  onSandTile: '#0B132B',
  greenTile: '#3A506B',
  onGreenTile: '#F5F2EC',
  shadow: '#0B132B',
};

// In ocean dark the primary button and the centre action turn peach.
const oceanDark: ColorTokens = {
  bg: '#0B132B',
  card: '#131B35',
  tile: '#1C2541',
  avatar: '#253152',
  line: '#243050',
  lineStrong: '#6F7FA0',
  fieldLine: '#6F7FA0',
  track: '#243050',
  grid: '#1E2944',
  text: '#F3F0EA',
  muted: '#A9B8CC',
  placeholder: '#8592AA',
  hero: '#1C2541',
  heroAlt: '#141C37',
  heroText: '#F3F0EA',
  heroMuted: '#B4C1D4',
  heroLine: 'rgba(244,214,176,0.22)',
  heroAccent: '#F4D6B0',
  heroTile: 'rgba(255,255,255,0.05)',
  heroTileLine: 'rgba(255,255,255,0.09)',
  heroOk: '#A9CDB7',
  heroOkSoft: 'rgba(169,205,183,0.14)',
  heroBtn: '#F4D6B0',
  heroBtnText: '#0B132B',
  primary: '#F4D6B0',
  onPrimary: '#0B132B',
  priSoft: '#1A3350',
  onPriSoft: '#CFEAF4',
  accent: '#F4D6B0',
  acc: '#F4D6B0',
  accSoft: '#3A2C17',
  ok: '#A9CDB7',
  okSoft: '#16291F',
  bad: '#F2B8AE',
  badSoft: '#331A17',
  warn: '#F4D6B0',
  warnSoft: '#3A2C17',
  chart: '#5BC0DE',
  chartSoft: '#5BC0DE',
  chart2: '#F4D6B0',
  tooltip: '#F3F0EA',
  onTooltip: '#0B132B',
  nav: '#131B35',
  navText: '#A9B8CC',
  navActive: '#F3F0EA',
  onNavActive: '#131B35',
  navIndicator: '#F4D6B0',
  fab: '#F4D6B0',
  onFab: '#0B132B',
  sandTile: '#3A2C17',
  onSandTile: '#F4D6B0',
  greenTile: '#253152',
  onGreenTile: '#F3F0EA',
  shadow: '#000000',
};

// Rose: charcoal carries text and actions on cool white; pink appears only
// in hairlines, the area fill, the active point and the tab indicator.
const roseLight: ColorTokens = {
  bg: '#F7F8FA',
  card: '#FFFFFF',
  tile: '#F1F5F9',
  avatar: '#E2E8F0',
  line: '#E3E8EF',
  lineStrong: '#8592A3',
  fieldLine: '#8592A3',
  track: '#E2E8F0',
  grid: '#EDF1F5',
  text: '#121212',
  muted: '#334155',
  placeholder: '#5B6779',
  hero: '#1F2937',
  heroAlt: '#121212',
  heroText: '#F1F5F9',
  heroMuted: '#B6C0CE',
  heroLine: 'rgba(236,72,153,0.30)',
  heroAccent: '#F9A8D4',
  heroTile: 'rgba(255,255,255,0.06)',
  heroTileLine: 'rgba(255,255,255,0.10)',
  heroOk: '#A9CDB7',
  heroOkSoft: 'rgba(169,205,183,0.14)',
  heroBtn: '#F9A8D4',
  heroBtnText: '#121212',
  primary: '#1F2937',
  onPrimary: '#FFFFFF',
  priSoft: '#F1F5F9',
  onPriSoft: '#1F2937',
  accent: '#EC4899',
  acc: '#BE185D',
  accSoft: '#FCE7F3',
  ok: '#2F5A43',
  okSoft: '#E5EEE8',
  bad: '#9E3B2F',
  badSoft: '#F7E6E2',
  warn: '#8F4E05',
  warnSoft: '#FAEBD5',
  chart: '#1F2937',
  chartSoft: '#EC4899',
  chart2: '#EC4899',
  tooltip: '#121212',
  onTooltip: '#F1F5F9',
  nav: '#FFFFFF',
  navText: '#5B6779',
  navActive: '#121212',
  onNavActive: '#FFFFFF',
  navIndicator: '#EC4899',
  fab: '#1F2937',
  onFab: '#F9A8D4',
  sandTile: '#FCE7F3',
  onSandTile: '#121212',
  greenTile: '#334155',
  onGreenTile: '#F1F5F9',
  shadow: '#121212',
};

// In rose dark the pink primary is used for the active chip and the FAB.
const roseDark: ColorTokens = {
  bg: '#121212',
  card: '#1A1E26',
  tile: '#1F2937',
  avatar: '#334155',
  line: '#2A3441',
  lineStrong: '#6E7E94',
  fieldLine: '#6E7E94',
  track: '#2A3441',
  grid: '#222A35',
  text: '#F1F5F9',
  muted: '#A7B2C2',
  placeholder: '#8994A6',
  hero: '#1F2937',
  heroAlt: '#171B22',
  heroText: '#F1F5F9',
  heroMuted: '#B6C0CE',
  heroLine: 'rgba(236,72,153,0.30)',
  heroAccent: '#F9A8D4',
  heroTile: 'rgba(255,255,255,0.05)',
  heroTileLine: 'rgba(255,255,255,0.09)',
  heroOk: '#A9CDB7',
  heroOkSoft: 'rgba(169,205,183,0.14)',
  heroBtn: '#F9A8D4',
  heroBtnText: '#121212',
  primary: '#EC4899',
  onPrimary: '#121212',
  priSoft: '#3B1D2C',
  onPriSoft: '#FBCFE8',
  accent: '#EC4899',
  acc: '#F9A8D4',
  accSoft: '#3B1D2C',
  ok: '#A9CDB7',
  okSoft: '#16291F',
  bad: '#F2B8AE',
  badSoft: '#331A17',
  warn: '#F4D6B0',
  warnSoft: '#3A2C17',
  chart: '#EC4899',
  chartSoft: '#EC4899',
  chart2: '#F1F5F9',
  tooltip: '#F1F5F9',
  onTooltip: '#121212',
  nav: '#1A1E26',
  navText: '#A7B2C2',
  navActive: '#F1F5F9',
  onNavActive: '#1A1E26',
  navIndicator: '#EC4899',
  fab: '#EC4899',
  onFab: '#121212',
  sandTile: '#3B1D2C',
  onSandTile: '#FBCFE8',
  greenTile: '#334155',
  onGreenTile: '#F1F5F9',
  shadow: '#000000',
};

export type PaletteName = 'ocean' | 'rose';

export const palettes = {
  ocean: { light: oceanLight, dark: oceanDark },
  rose: { light: roseLight, dark: roseDark },
} as const;

export const paletteNames: Record<PaletteName, { ar: string; en: string }> = { ocean: { ar: 'كحلي', en: 'Navy' }, rose: { ar: 'زهري', en: 'Pink' } };

// Kept for code that only needs the main palette.
export const light = oceanLight;
export const dark = oceanDark;

export const themes = { light, dark } as const;
export type SchemeName = keyof typeof themes;

// One control shape: radius 12 for buttons, inputs, icon buttons and icon
// badges; cards use 16. Only the centre action and dots are round.
export const radius = {
  badge: 6,
  segItem: 9,
  chip: 10,
  control: 12,
  tier: 14,
  card: 16,
  hero: 28,
  sheet: 28,
  avatar: 14,
  round: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Readex Pro weights loaded by the app; names match @expo-google-fonts/readex-pro.
export const font = {
  regular: 'ReadexPro_400Regular',
  medium: 'ReadexPro_500Medium',
  semibold: 'ReadexPro_600SemiBold',
  bold: 'ReadexPro_700Bold',
} as const;

// Type roles: [size, lineHeight]. Arabic never goes below 1.35× line height.
export const typeScale = {
  display: [40, 48],
  displaySm: [34, 44],
  h1: [24, 32],
  h2: [18, 26],
  h3: [15, 22],
  rowTitle: [14.5, 21],
  body: [14, 22],
  button: [15, 20],
  metric: [20, 26],
  small: [12.5, 18],
  caption: [11, 16],
  tab: [11, 14],
  axis: [10.5, 14],
} as const satisfies Record<string, readonly [number, number]>;
