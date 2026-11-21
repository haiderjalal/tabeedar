import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { StatusChip } from '@/components/status-chip';
import { Text } from '@/components/text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

import type { Address } from '../types';

interface AddressCardProps {
  address: Address;
  /** True for the address orders are currently being delivered to. */
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** A saved address with the actions on it: deliver here, edit, delete. */
export function AddressCard({ address, isSelected, onSelect, onEdit, onDelete }: AddressCardProps) {
  const { t } = useTranslation('addresses');
  const { t: tCommon } = useTranslation();
  const { colors } = useTheme();

  const place = [address.area, address.city].filter(Boolean).join(', ');

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          // A thicker border marks the chosen address, so colour is not the only signal.
          borderColor: isSelected ? colors.primary : colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
    >
      <View style={styles.titleRow}>
        <Text style={styles.label}>{address.label}</Text>
        {address.isDefault ? <StatusChip label={t('list.default')} tone="muted" /> : null}
        {isSelected ? <StatusChip label={t('list.selected')} tone="primary" /> : null}
      </View>

      {address.recipientName ? (
        <Text variant="caption" tone="muted">
          {t('list.forSomeone', { name: address.recipientName })}
        </Text>
      ) : null}
      <Text>{address.addressLine}</Text>
      <Text variant="caption" tone="muted">
        {place}
      </Text>
      {address.instructions ? (
        <Text variant="caption" tone="muted">
          {address.instructions}
        </Text>
      ) : null}

      <View style={styles.actions}>
        {!isSelected ? <Button label={t('list.select')} onPress={onSelect} /> : null}
        <Button label={tCommon('actions.edit')} variant="secondary" onPress={onEdit} />
        <Button label={tCommon('actions.delete')} variant="ghost" onPress={onDelete} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
