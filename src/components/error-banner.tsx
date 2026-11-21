import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

interface ErrorBannerProps {
  message: string;
}

/** A visible, screen-reader-announced error for a failed action (as opposed to a field error). */
export function ErrorBanner({ message }: ErrorBannerProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, { borderColor: colors.danger, backgroundColor: colors.surface }]}
    >
      <Text tone="danger">{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
