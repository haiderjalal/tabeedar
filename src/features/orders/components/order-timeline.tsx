import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/format';
import { spacing } from '@/theme';

import type { OrderEvent } from '../types';

interface OrderTimelineProps {
  events: OrderEvent[];
  /** Whose words to use for each step. A customer and a store describe the same step differently. */
  perspective?: 'customer' | 'store';
}

const DOT_SIZE = 10;

/** What has happened to the order so far, oldest first, with the time and any note from the store. */
export function OrderTimeline({ events, perspective = 'customer' }: OrderTimelineProps) {
  const { t } = useTranslation('orders');
  const { t: tStore } = useTranslation('storeOrders');
  const { language } = useLanguage();
  const { colors } = useTheme();

  function titleOf(event: OrderEvent): string {
    if (event.type === 'rider_assigned') {
      return perspective === 'store' ? tStore('detail.riderAssigned') : t('detail.riderAssigned');
    }
    return perspective === 'store' ? tStore(`status.${event.status}`) : t(`status.${event.status}`);
  }

  return (
    <View style={styles.list}>
      {events.map((event) => (
        <View key={event.id} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <View style={styles.text}>
            <Text style={styles.title}>{titleOf(event)}</Text>
            <Text variant="caption" tone="muted">
              {formatDateTime(event.createdAt, language)}
            </Text>
            {event.note ? <Text variant="caption">{event.note}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  item: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginTop: spacing.sm,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontWeight: '600',
  },
});
