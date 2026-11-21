import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useTheme } from '@/hooks/use-theme';
import { MIN_TOUCH_TARGET, radius, spacing } from '@/theme';

interface QuantityStepperProps {
  value: number;
  /** Called with the new quantity. Going below 1 is the caller's cue to remove the item. */
  onChange: (value: number) => void;
  max: number;
  /** Screen-reader text for the buttons and the number, already translated. */
  decreaseLabel: string;
  increaseLabel: string;
  quantityLabel: string;
}

/** A minus button, the quantity and a plus button, each large enough to tap comfortably. */
export function QuantityStepper({
  value,
  onChange,
  max,
  decreaseLabel,
  increaseLabel,
  quantityLabel,
}: QuantityStepperProps) {
  const { colors } = useTheme();
  const atMax = value >= max;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={decreaseLabel}
        onPress={() => onChange(value - 1)}
        style={[styles.button, { borderColor: colors.border, backgroundColor: colors.surface }]}
      >
        <Text style={styles.glyph}>−</Text>
      </Pressable>
      <Text accessibilityLabel={quantityLabel} style={styles.value}>
        {value}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={increaseLabel}
        aria-disabled={atMax}
        disabled={atMax}
        onPress={() => onChange(value + 1)}
        style={[
          styles.button,
          { borderColor: colors.border, backgroundColor: colors.surface, opacity: atMax ? 0.4 : 1 },
        ]}
      >
        <Text style={styles.glyph}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  button: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontWeight: '600',
  },
  value: {
    minWidth: 28,
    textAlign: 'center',
    fontWeight: '600',
  },
});
