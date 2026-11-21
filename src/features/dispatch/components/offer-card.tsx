import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { useTheme } from '@/hooks/use-theme';
import { formatDistance, formatRupees } from '@/lib/format';
import { radius, spacing } from '@/theme';

import type { DeliveryOffer } from '../types';

interface OfferCardProps {
  offer: DeliveryOffer;
  /** True while this offer is being accepted. */
  isAccepting: boolean;
  /** True while any offer is being accepted, so two cannot be sent at once. */
  isBusy: boolean;
  onAccept: () => void;
}

/**
 * One delivery a rider can take: where to collect it, how far, roughly where it goes, and what it
 * pays. It never shows who the customer is: that is revealed only after accepting.
 */
export function OfferCard({ offer, isAccepting, isBusy, onAccept }: OfferCardProps) {
  const { t } = useTranslation('rider');
  const { t: tCommon } = useTranslation();
  const { colors } = useTheme();

  const toStore = formatDistance(offer.riderToStoreM);
  const toCustomer = formatDistance(offer.storeToDropoffM);
  const place = [offer.dropoffArea, offer.dropoffCity].filter(Boolean).join(', ');

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={styles.strong}>{offer.storeName}</Text>
      <Text variant="caption" tone="muted">
        {offer.pickupAddress}
      </Text>
      <Text variant="caption">
        {t('offers.toStore', {
          distance: `${toStore.value} ${tCommon(`units.${toStore.unit}`)}`,
        })}
      </Text>
      <Text variant="caption">
        {t('offers.toCustomer', {
          distance: `${toCustomer.value} ${tCommon(`units.${toCustomer.unit}`)}`,
        })}
      </Text>
      <Text variant="caption" tone="muted">
        {t('offers.dropoff', { place })}
      </Text>
      <Text tone="primary" style={styles.strong}>
        {t('offers.fee', { amount: formatRupees(offer.deliveryFee) })}
      </Text>
      <Text variant="caption" tone="muted">
        {t('offers.total', { amount: formatRupees(offer.total) })}
      </Text>
      <Button
        label={t('offers.accept')}
        accessibilityLabel={t('offers.acceptLabel', { store: offer.storeName })}
        loading={isAccepting}
        disabled={isBusy && !isAccepting}
        onPress={onAccept}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  strong: {
    fontWeight: '600',
  },
});
