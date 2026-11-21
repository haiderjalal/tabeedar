import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing, type ThemeColors } from '@/theme';

type ChipTone = 'success' | 'danger' | 'primary' | 'muted';

const TONE_COLOR: Record<ChipTone, keyof ThemeColors> = {
  success: 'success',
  danger: 'danger',
  primary: 'primary',
  muted: 'textMuted',
};

interface StatusChipProps {
  label: string;
  tone: ChipTone;
}

/**
 * A small pill with a status ("Open", "On the way"). The meaning is in the words, never only in
 * the colour, so it still works for people who cannot tell the colours apart.
 */
export function StatusChip({ label, tone }: StatusChipProps) {
  const { colors } = useTheme();
  const color = colors[TONE_COLOR[tone]];

  return (
    <View style={[styles.chip, { borderColor: color, backgroundColor: colors.surface }]}>
      <Text variant="caption" style={{ color, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
