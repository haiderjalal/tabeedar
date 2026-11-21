import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { fontSize, lineHeightMultiplier, type ThemeColors } from '@/theme';

type TextVariant = 'title' | 'heading' | 'body' | 'caption';
type TextTone = 'default' | 'muted' | 'primary' | 'danger' | 'success';

const VARIANTS: Record<TextVariant, { size: number; weight: '400' | '600' | '700' }> = {
  title: { size: fontSize.title, weight: '700' },
  heading: { size: fontSize.heading, weight: '600' },
  body: { size: fontSize.body, weight: '400' },
  caption: { size: fontSize.caption, weight: '400' },
};

const TONE_COLOR: Record<TextTone, keyof ThemeColors> = {
  default: 'text',
  muted: 'textMuted',
  primary: 'primary',
  danger: 'danger',
  success: 'success',
};

interface TextProps extends NativeTextProps {
  variant?: TextVariant;
  tone?: TextTone;
}

/**
 * The only text component screens should use. It applies the theme colour and a line
 * height suited to the current language, so Urdu is never clipped.
 */
export function Text({ variant = 'body', tone = 'default', style, ...rest }: TextProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { size, weight } = VARIANTS[variant];

  return (
    <NativeText
      style={[
        {
          color: colors[TONE_COLOR[tone]],
          fontSize: size,
          fontWeight: weight,
          lineHeight: Math.round(size * lineHeightMultiplier[language]),
        },
        style,
      ]}
      {...rest}
    />
  );
}
