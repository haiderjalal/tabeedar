import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

import { useCurrentLocation } from '../hooks/use-current-location';
import { parseCoordinates, type Coordinates } from '../utils/coordinates';

interface LocationPickerProps {
  value: Coordinates | null;
  onChange: (coordinates: Coordinates) => void;
  /** Why the position is needed, in the caller's words (the reason differs between customers and stores). */
  hint: string;
  /** Form validation message, shown when the form is saved without a position. */
  error?: string;
}

const DISPLAY_DECIMALS = 5;

/**
 * Sets an address's map position, in two ways: from the phone's own location (for an address where
 * the customer is), or by pasting a Google Maps link or coordinates (for anywhere else, such as a
 * gift for someone in another city). The position decides the delivery fee.
 */
export function LocationPicker({ value, onChange, hint, error }: LocationPickerProps) {
  const { t } = useTranslation('location');
  const { colors } = useTheme();
  const { locate, isLocating, problem } = useCurrentLocation();
  const [pasted, setPasted] = useState('');
  const [pasteFailed, setPasteFailed] = useState(false);

  async function locateAndApply(): Promise<void> {
    const coordinates = await locate();
    if (coordinates) onChange(coordinates);
  }

  function applyPasted(): void {
    const coordinates = parseCoordinates(pasted);
    setPasteFailed(coordinates === null);
    if (coordinates) {
      onChange(coordinates);
      setPasted('');
    }
  }

  return (
    <View
      style={[
        styles.container,
        { borderColor: error ? colors.danger : colors.border, backgroundColor: colors.surface },
      ]}
    >
      <Text style={styles.title} accessibilityRole="header">
        {t('title')}
      </Text>
      <Text variant="caption" tone="muted">
        {hint}
      </Text>

      <Text tone={value ? 'success' : 'muted'} accessibilityLiveRegion="polite">
        {value
          ? t('set', {
              latitude: value.latitude.toFixed(DISPLAY_DECIMALS),
              longitude: value.longitude.toFixed(DISPLAY_DECIMALS),
            })
          : t('notSet')}
      </Text>

      <Button
        label={t('useCurrent')}
        variant="secondary"
        loading={isLocating}
        onPress={() => void locateAndApply()}
      />
      {problem ? (
        <Text variant="caption" tone="danger" accessibilityRole="alert">
          {t(problem === 'denied' ? 'denied' : 'unavailable')}
        </Text>
      ) : null}

      <TextField
        label={t('pasteLabel')}
        hint={t('pasteHint')}
        error={pasteFailed ? t('pasteInvalid') : undefined}
        value={pasted}
        onChangeText={(text) => {
          setPasted(text);
          setPasteFailed(false);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={applyPasted}
      />
      <Button
        label={t('apply')}
        variant="secondary"
        disabled={pasted.trim() === ''}
        onPress={applyPasted}
      />

      {error ? (
        <Text variant="caption" tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontWeight: '600',
  },
});
