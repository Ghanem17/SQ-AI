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

export const light: ColorTokens = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  tile: '#F6F4F1',
  avatar: '#ECE6DE',
  line: '#E7E3DD',
  lineStrong: '#7E827F',
  track: '#ECE8E2',
  text: '#0E1E21',
  muted: '#575C5B',
  placeholder: '#6A6F6D',
  hero: '#173E45',
  heroText: '#F4EDE7',
  heroMuted: '#C2D1CF',
  heroBtn: '#F4EDE7',
  heroBtnText: '#173E45',
  primary: '#173E45',
  onPrimary: '#FFFFFF',
  priSoft: '#E5EEEF',
  onPriSoft: '#173E45',
  okSoft: '#E8F0EB',
  ok: '#2F5A43',
  badSoft: '#F8E7E3',
  bad: '#9E3B2F',
  accSoft: '#F3EADC',
  acc: '#6A5332',
  fieldLine: '#7E827F',
  sandTile: '#CBAF87',
  onSandTile: '#0B2226',
  greenTile: '#3F5C4D',
  onGreenTile: '#F4EDE7',
  nav: '#FFFFFF',
  navText: '#5D6261',
  navActive: '#173E45',
  onNavActive: '#FFFFFF',
  chart: '#173E45',
  chartSoft: '#CBAF87',
};

export const dark: ColorTokens = {
  bg: '#091416',
  card: '#0F1F22',
  tile: '#132629',
  avatar: '#1A3337',
  line: '#1F3539',
  lineStrong: '#6E8784',
  track: '#1F3539',
  text: '#EEF1F0',
  muted: '#A3AFAD',
  placeholder: '#8D9A98',
  hero: '#173E45',
  heroText: '#F4EDE7',
  heroMuted: '#B9C9C7',
  heroBtn: '#CBAF87',
  heroBtnText: '#0B2226',
  primary: '#CBAF87',
  onPrimary: '#0B2226',
  priSoft: '#1D3A3F',
  onPriSoft: '#E3EEEE',
  okSoft: '#16291F',
  ok: '#A9CDB7',
  badSoft: '#331A17',
  bad: '#F2B8AE',
  accSoft: '#2C2417',
  acc: '#E3D2B4',
  fieldLine: '#6E8784',
  sandTile: '#CBAF87',
  onSandTile: '#0B2226',
  greenTile: '#3F5C4D',
  onGreenTile: '#F4EDE7',
  nav: '#0F1F22',
  navText: '#A3AFAD',
  navActive: '#CBAF87',
  onNavActive: '#0B2226',
  chart: '#CBAF87',
  chartSoft: '#3E5C60',
};

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
