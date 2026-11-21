import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { spacing } from '@/theme';

interface EmptyStateProps {
  title: string;
  /** A sentence explaining what is missing or what to do. Optional for a very short state. */
  message?: string;
  /** What the person can do about it, e.g. "Browse stores". */
  action?: { label: string; onPress: () => void };
}

/** Shown instead of an empty list, so a blank screen never looks broken. */
export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text variant="heading" accessibilityRole="header" style={styles.centered}>
        {title}
      </Text>
      {message ? (
        <Text tone="muted" style={styles.centered}>
          {message}
        </Text>
      ) : null}
      {action ? <Button label={action.label} onPress={action.onPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  centered: {
    textAlign: 'center',
  },
});
