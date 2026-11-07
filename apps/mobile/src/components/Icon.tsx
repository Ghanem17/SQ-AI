import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { useI18n } from '@/i18n';

// Stroke icons on a 24 grid: stroke 1.6, round caps and joins, as in the
// approved designs. A shape is a path string, or a circle, rect or ellipse;
// `fill` marks the solid parts of the filled tab variants.
type Shape =
  | string
  | { d: string; fill?: true }
  | { c: [number, number, number]; fill?: true }
  | { r: [number, number, number, number, number]; fill?: true }
  | { e: [number, number, number, number] };

const tabRects = (fill?: true): Shape[] =>
  [
    [4, 4],
    [13.5, 4],
    [4, 13.5],
    [13.5, 13.5],
  ].map(([x, y]) => ({ r: [x, y, 6.5, 6.5, 1.5], fill }));

const homePath = 'M3.5 10.2 12 3.5l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-4.2v-6h-5.6v6H5A1.5 1.5 0 0 1 3.5 19z';

const shapes = {
  // Tabs, with the filled variants used for the active tab.
  home: [homePath],
  homeFill: [{ d: homePath, fill: true }],
  apps: tabRects(),
  appsFill: tabRects(true),
  chart: ['M4 20h16M7 16.5v-5M12 16.5V7M17 16.5v-8'],
  chartFill: ['M4 20h16', { r: [5.6, 11, 2.8, 6, 1], fill: true }, { r: [10.6, 6.5, 2.8, 10.5, 1], fill: true }, { r: [15.6, 8, 2.8, 9, 1], fill: true }],
  user: [{ c: [12, 8, 4] }, 'M4.5 20.5c1.4-3.7 4.3-5.6 7.5-5.6s6.1 1.9 7.5 5.6'],
  userFill: [{ c: [12, 8, 4], fill: true }, { d: 'M4.5 20.5c1.4-3.7 4.3-5.6 7.5-5.6s6.1 1.9 7.5 5.6z', fill: true }],

  bell: ['M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z', 'M10 21h4'],
  search: [{ c: [11, 11, 6.5] }, 'M20 20l-4.2-4.2'],
  sliders: ['M4 7h9M17 7h3M4 17h3M11 17h9', { c: [15, 7, 2] }, { c: [9, 17, 2] }],
  video: [{ r: [3, 6, 13, 12, 2.5] }, 'M16 10.2l5-2.7v9l-5-2.7'],
  image: [{ r: [3.5, 4.5, 17, 15, 2.5] }, { c: [9, 10, 1.8] }, 'M20.5 15.5l-4.8-4.8-8.7 8.8'],
  film: [{ r: [3.5, 4.5, 17, 15, 2.5] }, 'M3.5 9h17', 'M10.2 12.2v4.6l3.9-2.3z'],
  edit: ['M4 20h4.2L19 9.2 14.8 5 4 15.8z', 'M12.8 7l4.2 4.2'],
  mic: [{ r: [9, 3, 6, 11, 3] }, 'M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21'],
  camera: ['M4 8.5h3.2L9 6h6l1.8 2.5H20v10.5H4z', { c: [12, 13.5, 3.3] }],
  chat: ['M4 5.5h16v11H9.5L5 20v-3.5H4z', 'M8 10h8M8 13h5'],
  ads: ['M4 10v4h3.5l7.5 4.5V5.5L7.5 10z', 'M18.5 9.5a3.5 3.5 0 0 1 0 5'],
  eye: ['M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z', { c: [12, 12, 3] }],
  wallet: [{ r: [3.5, 6, 17, 13, 2.5] }, 'M3.5 10h17M15.5 14.5h2'],
  receipt: ['M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8z', 'M9 8.5h6M9 12h6'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  clock: [{ c: [12, 12, 8.5] }, 'M12 7.5V12l3 2'],
  calendar: [{ r: [3.5, 5, 17, 15.5, 2.5] }, 'M3.5 10h17M8 3v4M16 3v4'],
  layers: ['M12 3.5l8.5 4.6L12 12.7 3.5 8.1z', 'M3.5 12.4l8.5 4.6 8.5-4.6', 'M3.5 16.4l8.5 4.6 8.5-4.6'],
  cpu: [{ r: [6, 6, 12, 12, 2] }, { r: [9.5, 9.5, 5, 5, 0.8] }, 'M9.5 2.5V6M14.5 2.5V6M9.5 18v3.5M14.5 18v3.5M2.5 9.5H6M2.5 14.5H6M18 9.5h3.5M18 14.5h3.5'],
  globe: [{ c: [12, 12, 8.5] }, 'M3.5 12h17M12 3.5c2.8 3.2 2.8 13.8 0 17M12 3.5c-2.8 3.2-2.8 13.8 0 17'],
  palette: [
    'M12 3.5a8.5 8.5 0 1 0 0 17c1.1 0 1.7-.7 1.7-1.6 0-1.2-.9-1.5-.9-2.5 0-.9.8-1.6 1.7-1.6H17a3.5 3.5 0 0 0 3.5-3.5c0-4.4-3.8-7.8-8.5-7.8z',
    { c: [8, 11, 1.1], fill: true },
    { c: [11, 7.5, 1.1], fill: true },
    { c: [15.5, 8.5, 1.1], fill: true },
  ],
  moon: ['M19.5 14.5A7.8 7.8 0 0 1 9.5 4.5a7.8 7.8 0 1 0 10 10z'],
  store: ['M4 9.5l1.6-5h12.8L20 9.5M4.5 9.5V20h15V9.5', 'M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M10 20v-5h4v5'],
  shield: ['M12 3.2l7.5 2.8v5.6c0 4.4-3.1 7.8-7.5 9.2-4.4-1.4-7.5-4.8-7.5-9.2V6z', 'M9 12l2.2 2.2L15.3 10'],
  coins: [
    { e: [9, 7, 5.5, 2.5] },
    'M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5S14.5 12.4 14.5 11V7',
    'M9.5 16.3c.9.1 1.7.2 2.5.2 3 0 5.5-1.1 5.5-2.5',
    { e: [15, 12.5, 5.5, 2.5] },
    'M9.5 12.5v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4',
  ],
  // Drawn for right-to-left (the arrow leaves toward the start side).
  logout: ['M14 4.5h4.5v15H14', 'M10 8l-4 4 4 4M6 12h9.5'],
  whatsapp: ['M4.5 19.5l1.2-3.7A7.9 7.9 0 1 1 8.4 18.4z', 'M9.2 8.6c.2 2.9 2.4 5.3 5.4 5.8l1-1.4-1.9-1-.8.8c-1-.5-1.8-1.3-2.3-2.3l.8-.8-1-1.9z'],
  phone: ['M5.2 4h3.6l1.8 4.6-2.3 1.4a10.5 10.5 0 0 0 5.7 5.7l1.4-2.3 4.6 1.8v3.6c0 .7-.5 1.2-1.2 1.2C10.6 19.7 4.3 13.4 4 5.2 4 4.5 4.5 4 5.2 4z'],
  info: [{ c: [12, 12, 8.5] }, 'M12 11v5.2M12 7.8v.1'],
  download: ['M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14'],
  share: [{ c: [17.5, 5.5, 2.3] }, { c: [6.5, 12, 2.3] }, { c: [17.5, 18.5, 2.3] }, 'M8.6 10.8l6.8-4M8.6 13.2l6.8 4'],
  arrowUp: ['M12 18V6M7 11l5-5 5 5'],
  arrowDown: ['M12 6v12M7 13l5 5 5-5'],
  sparkle: ['M12 3.5l1.7 5 5 1.7-5 1.7-1.7 5-1.7-5-5-1.7 5-1.7z', 'M18.5 16v4M16.5 18h4'],
  lock: [{ r: [5, 10.5, 14, 10, 2.2] }, 'M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3'],
  doc: ['M6 3.5h8.5l4 4v13H6z', 'M14 3.5V8h4.5M9 12.5h6M9 16h6'],
  close: ['M6 6l12 12M18 6 6 18'],
  link: ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'],
  target: [{ c: [12, 12, 8.5] }, { c: [12, 12, 4.5] }, { c: [12, 12, 1], fill: true }],
  users: [{ c: [9, 8.5, 3.5] }, 'M2.5 19.5c1-3.3 3.5-5 6.5-5s5.5 1.7 6.5 5', 'M15.5 5.3a3.5 3.5 0 0 1 0 6.4M17.5 14.8c1.9.6 3.3 2.2 4 4.7'],
  sun: [{ c: [12, 12, 4] }, 'M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4'],
  key: [{ c: [8, 15, 4] }, 'M11 12l8.5-8.5M16.5 6.5l2.5 2.5M14.5 8.5l2 2'],
  plus: ['M12 5v14M5 12h14'],
  minus: ['M5 12h14'],
  chevronDown: ['M6 9l6 6 6-6'],
  chevronUp: ['M18 15l-6-6-6 6'],
  // Directional icons are drawn for right-to-left and mirrored in English:
  // back points right, forward (chevron, arrow, send) points left.
  back: ['M9 6l6 6-6 6'],
  chevronLeft: ['M15 6l-6 6 6 6'],
  arrow: ['M19 12H5M11 6l-6 6 6 6'],
  send: ['M20 12H5', 'M11 5.5 4.5 12l6.5 6.5'],
  trend: ['M3.5 16.5l5.5-5.5 4 4 7.5-7.5', 'M14.5 7.5h6v6'],
  bulb: ['M9 18h6', 'M10 21.5h4', 'M12 2.5a6.8 6.8 0 0 0-3.9 12.4V16h7.8v-1.1A6.8 6.8 0 0 0 12 2.5z'],
  bolt: ['M13 2.5 4.5 14h7l-1 7.5 8.5-11.5h-7z'],
  alert: ['M12 3.5 2.8 19.5h18.4z', 'M12 10v4.2', 'M12 17v.1'],
  refresh: ['M19.5 11a7.6 7.6 0 0 0-14.1-3', 'M4.5 4v4h4', 'M4.5 13a7.6 7.6 0 0 0 14.1 3', 'M19.5 20v-4h-4'],
  flip: ['M3.5 7.5h13l-3-3', 'M20.5 16.5h-13l3 3'],
  grid: ['M9 3.5v17', 'M15 3.5v17', 'M3.5 9h17', 'M3.5 15h17'],
  filter: ['M4 6h16', 'M7 12h10', 'M10 18h4'],
  bag: ['M6 7.5h12l1 13H5z', 'M9 7.5a3 3 0 0 1 6 0'],
  handshake: ['M3 11l4-4 4 2 3-2 7 5', 'M3 11l6 6a2 2 0 0 0 3 0l6-5', 'M11 14l2 2'],
  dot: [{ c: [12, 12, 1.2], fill: true }],
  settings: [
    { c: [12, 12, 3] },
    'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  ],
} satisfies Record<string, Shape[]>;

export type IconName = keyof typeof shapes | 'play';

type Props = { name: IconName; size?: number; color: string; strokeWidth?: number };

const directional = new Set<IconName>(['back', 'chevronLeft', 'arrow', 'send', 'logout']);
const mirrored = { transform: [{ scaleX: -1 }] };

function renderShape(s: Shape, i: number, color: string, strokeWidth: number) {
  const stroke = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (typeof s === 'string') return <Path key={i} d={s} fill="none" {...stroke} />;
  if ('d' in s) return <Path key={i} d={s.d} fill={s.fill ? color : 'none'} {...stroke} />;
  if ('c' in s) return <Circle key={i} cx={s.c[0]} cy={s.c[1]} r={s.c[2]} fill={s.fill ? color : 'none'} {...stroke} />;
  if ('e' in s) return <Ellipse key={i} cx={s.e[0]} cy={s.e[1]} rx={s.e[2]} ry={s.e[3]} fill="none" {...stroke} />;
  const [x, y, w, h, rx] = s.r;
  return <Rect key={i} x={x} y={y} width={w} height={h} rx={rx} fill={s.fill ? color : 'none'} {...stroke} />;
}

export function Icon({ name, size = 20, color, strokeWidth = 1.6 }: Props) {
  const { rtl } = useI18n();
  if (name === 'play') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
        <Path d="M8 5v14l11-7z" fill={color} />
      </Svg>
    );
  }
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={!rtl && directional.has(name) ? mirrored : undefined}
      accessibilityElementsHidden
      importantForAccessibility="no">
      {(shapes[name] as Shape[]).map((s, i) => renderShape(s, i, color, strokeWidth))}
    </Svg>
  );
}
