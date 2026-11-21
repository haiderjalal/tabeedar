import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { spacing } from '@/theme';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

/** A failed load: says what happened in plain words and offers to try again. */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text tone="danger" accessibilityRole="alert" style={styles.centered}>
        {message}
      </Text>
      <Button label={t('actions.retry')} variant="secondary" onPress={onRetry} />
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
