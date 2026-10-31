// Design tokens for SQ AI, taken from the approved Bento design.
// Every screen reads colors from these tokens, never from literals.

export const brand = {
  teal: '#173E45',
  tealDeep: '#0B2226',
  tealLine: '#3A6169',
  thumb: '#24525A',
  cream: '#F4EDE7',
  sand: '#CBAF87',
  sandDeep: '#9C8259',
  green: '#3F5C4D',
  greenBrand: '#547564',
  greenLight: '#8FB9A2',
  gray: '#8A8C8A',
  ink: '#0B2226',
  // Muted text that stays readable on each brand surface.
  creamOnTeal: '#C9D6D4',
  creamOnDeep: '#B9C9C7',
  inkOnCream: '#4F524F',
  inkOnSand: '#3A2E1C',
} as const;

export type ColorTokens = {
  bg: string;
  tile: string;
  avatar: string;
  line: string;
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
};

export const light: ColorTokens = {
  bg: '#FFFFFF',
  tile: '#F4EDE7',
  avatar: '#E8DDCF',
  line: '#E8E0D6',
  track: '#E2D6C6',
  text: '#0B2226',
  muted: '#4F524F',
  placeholder: '#676A67',
  hero: '#173E45',
  heroText: '#F4EDE7',
  heroMuted: '#C9D6D4',
  heroBtn: '#F4EDE7',
  heroBtnText: '#173E45',
  primary: '#173E45',
  onPrimary: '#F4EDE7',
  priSoft: '#DCEBEC',
  onPriSoft: '#173E45',
  okSoft: '#E6EFE9',
  ok: '#3F5C4D',
  badSoft: '#F8E5E1',
  bad: '#9E3B2F',
  accSoft: '#EADBC3',
  acc: '#5E4A2C',
  fieldLine: '#9C8259',
  sandTile: '#CBAF87',
  onSandTile: '#0B2226',
  greenTile: '#3F5C4D',
  onGreenTile: '#F4EDE7',
  nav: '#173E45',
  navText: '#E3EEEE',
  navActive: '#CBAF87',
  onNavActive: '#0B2226',
};

export const dark: ColorTokens = {
  bg: '#0B2226',
  tile: '#102E33',
  avatar: '#173E45',
  line: '#1D4249',
  track: '#24525A',
  text: '#F4EDE7',
  muted: '#A9B3B1',
  placeholder: '#8FA09D',
  hero: '#173E45',
  heroText: '#F4EDE7',
  heroMuted: '#B9C9C7',
  heroBtn: '#CBAF87',
  heroBtnText: '#0B2226',
  primary: '#CBAF87',
  onPrimary: '#0B2226',
  priSoft: '#24525A',
  onPriSoft: '#E3EEEE',
  okSoft: '#1E3329',
  ok: '#BFD6C9',
  badSoft: '#3D1F1B',
  bad: '#F2B8AE',
  accSoft: '#3E3220',
  acc: '#E9DCC6',
  fieldLine: '#CBAF87',
  sandTile: '#CBAF87',
  onSandTile: '#0B2226',
  greenTile: '#3F5C4D',
  onGreenTile: '#F4EDE7',
  nav: '#173E45',
  navText: '#E3EEEE',
  navActive: '#CBAF87',
  onNavActive: '#0B2226',
};

export const themes = { light, dark } as const;
export type SchemeName = keyof typeof themes;

export const radius = {
  tile: 28,
  card: 24,
  control: 16,
  chip: 12,
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
  caption: 12,
  small: 13,
  body: 14,
  bodyLg: 16,
  title: 21,
  headline: 26,
  display: 34,
  metric: 40,
} as const;
