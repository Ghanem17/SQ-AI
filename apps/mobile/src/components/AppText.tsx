import { Text, type TextProps } from 'react-native';

import { font, typeScale } from '@sq/shared';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';

export type Weight = keyof typeof font;
export type TypeRole = keyof typeof typeScale;

// The weight each type role uses unless a screen asks for another.
const roleWeight: Partial<Record<TypeRole, Weight>> = {
  display: 'bold',
  displaySm: 'bold',
  h1: 'bold',
  h2: 'semibold',
  h3: 'semibold',
  rowTitle: 'semibold',
  button: 'semibold',
  metric: 'bold',
  caption: 'medium',
  tab: 'medium',
};

type Props = TextProps & {
  // A role from the type scale sets size, line height and weight together.
  variant?: TypeRole;
  weight?: Weight;
  size?: number;
  color?: string;
  center?: boolean;
  lineHeight?: number;
};

// Text in the app font, written in the interface language's direction.
// Arabic needs room, so line height never drops below 1.35× the size.
export function AppText({ variant: role, weight, size, color, center, lineHeight, style, ...rest }: Props) {
  const { c } = useTheme();
  const { rtl } = useI18n();
  const [roleSize, roleLine] = role ? typeScale[role] : typeScale.body;
  const fontSize = size ?? roleSize;
  const line = lineHeight ?? (size !== undefined && !role ? Math.round(fontSize * 1.45) : size !== undefined ? Math.max(roleLine, Math.round(fontSize * 1.35)) : roleLine);
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: font[weight ?? (role ? (roleWeight[role] ?? 'regular') : 'regular')],
          fontSize,
          lineHeight: line,
          color: color ?? c.text,
          writingDirection: rtl ? 'rtl' : 'ltr',
        },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}
