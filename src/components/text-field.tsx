import { useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/components/text';
import { useTheme } from '@/hooks/use-theme';
import { MIN_TOUCH_TARGET, fontSize, radius, spacing } from '@/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  /** Helper text shown under the field while there is no error. */
  hint?: string;
  /** Validation message. Replaces the hint and turns the border red. */
  error?: string;
  /** Something shown inside the field on the trailing side, e.g. a show/hide button. */
  trailing?: ReactNode;
  // Derived from the component, because React Native's own instance type differs between versions.
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

/**
 * A labelled text input with an error and hint line. The label is always visible (never rely on
 * a placeholder as the label) and is also announced by screen readers.
 */
export function TextField({
  label,
  hint,
  error,
  trailing,
  ref,
  onFocus,
  onBlur,
  style,
  ...inputProps
}: TextFieldProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error ? colors.danger : isFocused ? colors.primary : colors.border;

  return (
    <View style={styles.field}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <View style={[styles.inputRow, { borderColor, backgroundColor: colors.surface }]}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text }, style]}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
        {trailing}
      </View>
      {error ? (
        <Text variant="caption" tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  inputRow: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    // No fixed line height: it can clip Urdu and misplace the cursor.
    fontSize: fontSize.body,
    paddingVertical: spacing.sm,
  },
});
