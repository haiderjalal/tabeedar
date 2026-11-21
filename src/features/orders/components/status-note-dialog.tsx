import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

/** Longest reason accepted. Matches the limit in `update_order_status`. */
export const MAX_NOTE_LENGTH = 500;

interface StatusNoteDialogProps {
  visible: boolean;
  title: string;
  message: string;
  noteLabel: string;
  noteHint: string;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  /** Called with the reason the person typed, or null if they left it empty. */
  onConfirm: (note: string | null) => void;
  onCancel: () => void;
}

/**
 * Asks "are you sure?" for a move that ends the order, with an optional reason the customer will
 * see. A modal like `ConfirmDialog` (the system `Alert` does nothing on web), with one text field.
 * Mount it only while it is needed, so the reason typed last time is never shown again.
 */
export function StatusNoteDialog({
  visible,
  title,
  message,
  noteLabel,
  noteHint,
  confirmLabel,
  cancelLabel,
  loading = false,
  onConfirm,
  onCancel,
}: StatusNoteDialogProps) {
  const { colors } = useTheme();
  const [note, setNote] = useState('');

  function confirm(): void {
    const trimmed = note.trim();
    onConfirm(trimmed === '' ? null : trimmed);
  }

  function cancel(): void {
    setNote('');
    onCancel();
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={cancel}>
      {/* Keeps the card above the keyboard while the reason is being typed. */}
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <Pressable
          accessibilityLabel={cancelLabel}
          onPress={cancel}
          style={[styles.backdrop, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
        >
          {/* A nested Pressable stops taps on the card from reaching the backdrop. */}
          <Pressable
            accessible={false}
            onPress={() => undefined}
            aria-modal
            style={[
              styles.card,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <Text variant="heading" accessibilityRole="header">
              {title}
            </Text>
            <Text tone="muted">{message}</Text>
            <TextField
              label={noteLabel}
              hint={noteHint}
              value={note}
              onChangeText={setNote}
              maxLength={MAX_NOTE_LENGTH}
              multiline
            />
            <View style={styles.actions}>
              <Button label={confirmLabel} variant="danger" loading={loading} onPress={confirm} />
              <Button label={cancelLabel} variant="secondary" onPress={cancel} disabled={loading} />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
