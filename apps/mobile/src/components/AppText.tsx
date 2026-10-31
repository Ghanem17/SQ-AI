import { Text, type TextProps } from 'react-native';

import { font, typeScale } from '@sq/shared';
import { useTheme } from '@/theme/theme';

export type Weight = keyof typeof font;

type Props = TextProps & {
  weight?: Weight;
  size?: number;
  color?: string;
  center?: boolean;
  lineHeight?: number;
};

// Arabic text with the app font. Alignment is left to the text itself
// (natural), which puts Arabic on the right in every layout direction.
export function AppText({ weight = 'regular', size = typeScale.body, color, center, lineHeight, style, ...rest }: Props) {
  const { c } = useTheme();
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: font[weight],
          fontSize: size,
          lineHeight: lineHeight ?? Math.round(size * 1.45),
          color: color ?? c.text,
          writingDirection: 'rtl',
        },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}
