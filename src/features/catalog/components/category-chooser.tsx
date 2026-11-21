import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import type { Category } from '@/features/stores/types';
import { spacing } from '@/theme';

interface CategoryChooserProps {
  label: string;
  /** The text of the "no category" choice. */
  noneLabel: string;
  categories: Category[];
  /** The chosen category, or null for none. */
  value: number | null;
  onChange: (categoryId: number | null) => void;
}

/**
 * Picks one category (or none) with a row of buttons. A store has a handful of categories, so a
 * visible list is quicker to use than a dropdown and needs no extra component.
 */
export function CategoryChooser({
  label,
  noneLabel,
  categories,
  value,
  onChange,
}: CategoryChooserProps) {
  return (
    <View style={styles.field}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <View accessibilityLabel={label} style={styles.options}>
        <Button
          label={noneLabel}
          variant={value === null ? 'primary' : 'secondary'}
          selected={value === null}
          onPress={() => onChange(null)}
        />
        {categories.map((category) => (
          <Button
            key={category.id}
            label={category.name}
            variant={value === category.id ? 'primary' : 'secondary'}
            selected={value === category.id}
            onPress={() => onChange(category.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
