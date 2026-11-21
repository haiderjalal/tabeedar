import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/text';
import { useTheme } from '@/hooks/use-theme';
import { MIN_TOUCH_TARGET, fontSize, radius, spacing } from '@/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  /** What screen readers call the field (a search box is allowed to rely on its placeholder visually). */
  accessibilityLabel: string;
  clearLabel: string;
}

/** A single-line search field with a button to clear it. */
export function SearchBar({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  clearLabel,
}: SearchBarProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <TextInput
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.input, { color: colors.text }]}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          onPress={() => onChangeText('')}
          hitSlop={spacing.sm}
          style={styles.clear}
        >
          <Text tone="muted">✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize.body,
    paddingVertical: spacing.sm,
  },
  clear: {
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
