import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

interface FormScreenProps {
  children: ReactNode;
  /** Which edges keep clear of system bars. All four by default; screens under a header skip the top. */
  edges?: readonly Edge[];
}

/**
 * Container for screens with text inputs: scrolls when the content is taller than the screen and
 * keeps the focused field above the keyboard. Taps on buttons still work while the keyboard is open.
 */
export function FormScreen({ children, edges }: FormScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={edges} style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
});
