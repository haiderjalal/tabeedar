import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Styles the confirm button as dangerous (deleting, cancelling). */
  destructive?: boolean;
  /** Shows a spinner on the confirm button while the action runs. */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Asks "are you sure?" before something that cannot be undone. It is a real modal (the system
 * `Alert` does nothing on web), so it also works in the browser. Tapping outside or the back
 * button counts as cancelling.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors } = useTheme();

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <Pressable
        accessibilityLabel={cancelLabel}
        onPress={onCancel}
        style={[styles.backdrop, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
      >
        {/* A nested Pressable stops taps on the card from reaching the backdrop. */}
        <Pressable
          accessible={false}
          onPress={() => undefined}
          aria-modal
          style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <Text variant="heading" accessibilityRole="header">
            {title}
          </Text>
          <Text tone="muted">{message}</Text>
          <View style={styles.actions}>
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              loading={loading}
              onPress={onConfirm}
            />
            <Button label={cancelLabel} variant="secondary" onPress={onCancel} disabled={loading} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
