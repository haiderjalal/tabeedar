import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Text } from '@/components/text';
import { useTheme } from '@/hooks/use-theme';
import { MIN_TOUCH_TARGET, radius, spacing, type ThemeColors } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  /** Shows a spinner and blocks presses, e.g. while a request is in flight. */
  loading?: boolean;
  /** Marks the button as the chosen option in a group (announced by screen readers). */
  selected?: boolean;
}

/** Background colour of each variant. Primary and danger are solid; the others are quiet. */
function backgroundFor(variant: ButtonVariant, colors: ThemeColors): string {
  switch (variant) {
    case 'primary':
      return colors.primary;
    case 'danger':
      return colors.danger;
    case 'secondary':
      return colors.surface;
    case 'ghost':
      return 'transparent';
  }
}

/**
 * One button component with four emphasis levels; screens must not restyle it. Use `danger` only
 * for actions that cannot be undone, such as deleting or cancelling.
 */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  selected,
  disabled,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = Boolean(disabled) || loading;
  const isSolid = variant === 'primary' || variant === 'danger';
  const textColor = isSolid ? colors.onPrimary : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      // `aria-*` props (not accessibilityState) so the states are also announced on web.
      aria-disabled={isDisabled}
      aria-busy={loading}
      aria-selected={selected}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: backgroundFor(variant, colors),
          borderColor: variant === 'secondary' ? colors.border : 'transparent',
          opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={{ color: textColor, fontWeight: '600' }}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
