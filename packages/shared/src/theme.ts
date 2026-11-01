// Design tokens for SQ AI, taken from the approved Bento design.
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
  // Muted text that stays readable on the navy surfaces.
  lightMuted: '#A9B8CC',
  green: '#3F5C4D',
  greenBrand: '#547564',
  greenLight: '#8FB9A2',
} as const;

export type ColorTokens = {
  bg: string;
  // Raised surfaces: cards sit on the page with a hairline border.
  card: string;
  // Recessed surfaces: inputs, segmented controls, quiet fills.
  tile: string;
  avatar: string;
  line: string;
  // Stronger hairline for inputs and selected outlines.
  lineStrong: string;
  track: string;
  text: string;
  muted: string;
  placeholder: string;
  hero: string;
  heroText: string;
  heroMuted: string;
  heroBtn: string;
  heroBtnText: string;
  primary: string;
  onPrimary: string;
  priSoft: string;
  onPriSoft: string;
  okSoft: string;
  ok: string;
  badSoft: string;
  bad: string;
  accSoft: string;
  acc: string;
  fieldLine: string;
  sandTile: string;
  onSandTile: string;
  greenTile: string;
  onGreenTile: string;
  nav: string;
  navText: string;
  navActive: string;
  onNavActive: string;
  chart: string;
  chartSoft: string;
};

// Ocean: the main palette. Navy carries text and actions, sky blue the
// highlights, and orange the one call to action on the dark card.
const oceanLight: ColorTokens = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  tile: '#F3F6FA',
  avatar: '#E3E9F2',
  line: '#E2E7EF',
  lineStrong: '#76839A',
  track: '#E6EBF2',
  text: '#0B132B',
  muted: '#3A506B',
  placeholder: '#5D6B80',
  hero: '#0B132B',
  heroText: '#F1F5F9',
  heroMuted: '#A9B8CC',
  heroBtn: '#D97706',
  heroBtnText: '#0B132B',
  primary: '#1C2541',
  onPrimary: '#FFFFFF',
  priSoft: '#E3F4FA',
  onPriSoft: '#1C2541',
  okSoft: '#E8F0EB',
  ok: '#2F5A43',
  badSoft: '#F8E7E3',
  bad: '#9E3B2F',
  accSoft: '#FBEBD6',
  acc: '#8A4B08',
  fieldLine: '#76839A',
  sandTile: '#F4D6B0',
  onSandTile: '#0B132B',
  greenTile: '#3F5C4D',
  onGreenTile: '#F1F5F9',
  nav: '#FFFFFF',
  navText: '#53627A',
  navActive: '#1C2541',
  onNavActive: '#FFFFFF',
  chart: '#1C2541',
  chartSoft: '#5BC0DE',
};

const oceanDark: ColorTokens = {
  bg: '#0B132B',
  card: '#121C38',
  tile: '#1C2541',
  avatar: '#253152',
  line: '#24304F',
  lineStrong: '#6F7FA0',
  track: '#24304F',
  text: '#F1F5F9',
  muted: '#A9B8CC',
  placeholder: '#8B9AB4',
  hero: '#1C2541',
  heroText: '#F1F5F9',
  heroMuted: '#B4C1D4',
  heroBtn: '#D97706',
  heroBtnText: '#0B132B',
  primary: '#5BC0DE',
  onPrimary: '#0B132B',
  priSoft: '#183B52',
  onPriSoft: '#DDF2F9',
  okSoft: '#16291F',
  ok: '#A9CDB7',
  badSoft: '#331A17',
  bad: '#F2B8AE',
  accSoft: '#3A2A12',
  acc: '#F4D6B0',
  fieldLine: '#6F7FA0',
  sandTile: '#F4D6B0',
  onSandTile: '#0B132B',
  greenTile: '#3F5C4D',
  onGreenTile: '#F1F5F9',
  nav: '#121C38',
  navText: '#A9B8CC',
  navActive: '#5BC0DE',
  onNavActive: '#0B132B',
  chart: '#5BC0DE',
  chartSoft: '#3A506B',
};

// Rose: the second palette. Slate greys with pink as the accent.
const roseLight: ColorTokens = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  tile: '#F1F5F9',
  avatar: '#E2E8F0',
  line: '#E2E8F0',
  lineStrong: '#647488',
  track: '#E2E8F0',
  text: '#121212',
  muted: '#334155',
  placeholder: '#56637A',
  hero: '#1F2937',
  heroText: '#F1F5F9',
  heroMuted: '#B6C0CE',
  heroBtn: '#EC4899',
  heroBtnText: '#121212',
  primary: '#BE185D',
  onPrimary: '#FFFFFF',
  priSoft: '#FCE7F3',
  onPriSoft: '#9D174D',
  okSoft: '#E8F0EB',
  ok: '#2F5A43',
  badSoft: '#F8E7E3',
  bad: '#9E3B2F',
  accSoft: '#FDF2F8',
  acc: '#9D174D',
  fieldLine: '#647488',
  sandTile: '#FCE7F3',
  onSandTile: '#121212',
  greenTile: '#334155',
  onGreenTile: '#F1F5F9',
  nav: '#FFFFFF',
  navText: '#56637A',
  navActive: '#BE185D',
  onNavActive: '#FFFFFF',
  chart: '#EC4899',
  chartSoft: '#CBD5E1',
};

const roseDark: ColorTokens = {
  bg: '#121212',
  card: '#1A1F29',
  tile: '#1F2937',
  avatar: '#334155',
  line: '#2A3441',
  lineStrong: '#6E7E94',
  track: '#334155',
  text: '#F1F5F9',
  muted: '#A7B2C2',
  placeholder: '#8994A6',
  hero: '#1F2937',
  heroText: '#F1F5F9',
  heroMuted: '#B6C0CE',
  heroBtn: '#EC4899',
  heroBtnText: '#121212',
  primary: '#EC4899',
  onPrimary: '#121212',
  priSoft: '#3B1D2C',
  onPriSoft: '#FBCFE8',
  okSoft: '#16291F',
  ok: '#A9CDB7',
  badSoft: '#331A17',
  bad: '#F2B8AE',
  accSoft: '#3B1D2C',
  acc: '#F9A8D4',
  fieldLine: '#6E7E94',
  sandTile: '#FCE7F3',
  onSandTile: '#121212',
  greenTile: '#334155',
  onGreenTile: '#F1F5F9',
  nav: '#1A1F29',
  navText: '#A7B2C2',
  navActive: '#EC4899',
  onNavActive: '#121212',
  chart: '#EC4899',
  chartSoft: '#475569',
};

export type PaletteName = 'ocean' | 'rose';

export const palettes = {
  ocean: { light: oceanLight, dark: oceanDark },
  rose: { light: roseLight, dark: roseDark },
} as const;

export const paletteNames: Record<PaletteName, string> = { ocean: 'كحلي', rose: 'وردي' };

// Kept for code that only needs the main palette.
export const light = oceanLight;
export const dark = oceanDark;

export const themes = { light, dark } as const;
export type SchemeName = keyof typeof themes;

// Tight corners read as precise and trustworthy; nothing is pill-shaped
// except avatars and small status dots.
export const radius = {
  tile: 14,
  card: 12,
  control: 10,
  chip: 6,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

// Readex Pro weights loaded by the app; names match @expo-google-fonts/readex-pro.
export const font = {
  regular: 'ReadexPro_400Regular',
  medium: 'ReadexPro_500Medium',
  semibold: 'ReadexPro_600SemiBold',
  bold: 'ReadexPro_700Bold',
} as const;

export const typeScale = {
  caption: 11.5,
  small: 12.5,
  body: 14,
  bodyLg: 15,
  title: 17,
  headline: 22,
  display: 28,
  metric: 30,
} as const;
