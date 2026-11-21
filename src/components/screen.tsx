import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  /**
   * Which screen edges keep clear of notches and system bars. All four by default. Screens under a
   * header or above a tab bar pass fewer, because those already cover the top or the bottom.
   */
  edges?: readonly Edge[];
  /** Turn off the standard padding for screens that lay out their own (full-width lists). */
  padded?: boolean;
}

/** Base container for every screen: respects notches/system bars and applies the theme. */
export function Screen({ children, edges, padded = true }: ScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.container, padded && styles.padded, { backgroundColor: colors.background }]}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  padded: {
    padding: spacing.lg,
  },
});
