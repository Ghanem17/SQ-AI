import { Text, type TextProps } from 'react-native';

import { font, typeScale } from '@sq/shared';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/theme';

export type Weight = keyof typeof font;

type Props = TextProps & {
  weight?: Weight;
  size?: number;
  color?: string;
  center?: boolean;
  lineHeight?: number;
};

// Text in the app font, written in the interface language's direction.
export function AppText({ weight = 'regular', size = typeScale.body, color, center, lineHeight, style, ...rest }: Props) {
  const { c } = useTheme();
  const { rtl } = useI18n();
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: font[weight],
          fontSize: size,
          lineHeight: lineHeight ?? Math.round(size * 1.45),
          color: color ?? c.text,
          writingDirection: rtl ? 'rtl' : 'ltr',
        },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}
