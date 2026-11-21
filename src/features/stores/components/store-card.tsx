import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { StatusChip } from '@/components/status-chip';
import { Text } from '@/components/text';
import { publicImageUrl } from '@/features/media/services/media.service';
import { useTheme } from '@/hooks/use-theme';
import { formatDistance } from '@/lib/format';
import { radius, spacing } from '@/theme';

import type { StoreSummary } from '../types';

interface StoreCardProps {
  store: StoreSummary;
  onPress: () => void;
}

/** One store in a list: picture, name, open or closed, distance, and what matched a search. */
export function StoreCard({ store, onPress }: StoreCardProps) {
  const { t } = useTranslation('stores');
  const { t: tCommon } = useTranslation();
  const { colors } = useTheme();

  const distance = formatDistance(store.distanceM);
  const place = [store.area, store.city].filter(Boolean).join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('card.openStore', { name: store.name })}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Avatar name={store.name} uri={publicImageUrl(store.logoPath)} />
      <View style={styles.body}>
        <Text style={styles.name}>{store.name}</Text>
        {store.description ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {store.description}
          </Text>
        ) : null}
        <Text variant="caption" tone="muted">
          {place} ·{' '}
          {t('card.away', { distance: distance.value, unit: tCommon(`units.${distance.unit}`) })}
        </Text>
        {store.matchingProducts.length > 0 ? (
          <Text variant="caption" tone="primary" numberOfLines={2}>
            {t('card.has', { products: store.matchingProducts.join(', ') })}
          </Text>
        ) : null}
        <StatusChip
          label={store.isOpen ? t('card.open') : t('card.closed')}
          tone={store.isOpen ? 'success' : 'muted'}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontWeight: '600',
  },
});
