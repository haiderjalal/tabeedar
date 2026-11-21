import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Screen } from '@/components/screen';
import { SearchBar } from '@/components/search-bar';
import { Text } from '@/components/text';
import { useSelectedAddress } from '@/features/addresses/hooks/use-selected-address';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

import { StoreCard } from '../components/store-card';
import { useStoreSearch } from '../hooks/use-store-search';

const SEARCH_DELAY_MS = 350;

/**
 * The customer's front page: stores near the chosen delivery address, nearest first, with a search
 * box that looks through store names and product names.
 */
export function StoresScreen() {
  const { t } = useTranslation('stores');
  const { t: tCommon } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const {
    address,
    isLoading: isLoadingAddresses,
    isError: addressesFailed,
    refetch: refetchAddresses,
  } = useSelectedAddress();
  const [text, setText] = useState('');
  const query = useDebouncedValue(text.trim(), SEARCH_DELAY_MS);

  const search = useStoreSearch({
    location: address ? { latitude: address.latitude, longitude: address.longitude } : null,
    query,
  });
  const stores = search.data?.pages.flat() ?? [];

  if (isLoadingAddresses) return <LoadingState />;
  if (addressesFailed) {
    return <ErrorState message={tCommon('errors.network')} onRetry={refetchAddresses} />;
  }
  if (!address) {
    return (
      <EmptyState
        title={t('home.noAddressTitle')}
        message={t('home.noAddressBody')}
        action={{ label: t('home.addAddress'), onPress: () => router.push('/addresses/new') }}
      />
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('home.deliveringTo')} ${address.label}. ${t('home.change')}`}
          onPress={() => router.push('/addresses')}
          style={[
            styles.addressBar,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <View style={styles.addressText}>
            <Text variant="caption" tone="muted">
              {t('home.deliveringTo')}
            </Text>
            <Text numberOfLines={1} style={styles.addressLabel}>
              {address.label} · {address.addressLine}
            </Text>
          </View>
          <Text tone="primary">{t('home.change')}</Text>
        </Pressable>

        <SearchBar
          value={text}
          onChangeText={setText}
          placeholder={t('home.searchPlaceholder')}
          accessibilityLabel={t('home.searchLabel')}
          clearLabel={tCommon('actions.clearSearch')}
        />
      </View>

      {search.isPending ? (
        <LoadingState />
      ) : search.isError ? (
        <ErrorState message={t('home.loadError')} onRetry={() => void search.refetch()} />
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(store) => String(store.id)}
          renderItem={({ item }) => (
            <StoreCard
              store={item}
              onPress={() =>
                router.push({ pathname: '/stores/[id]', params: { id: String(item.id) } })
              }
            />
          )}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          refreshing={search.isRefetching && !search.isFetchingNextPage}
          onRefresh={() => void search.refetch()}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (search.hasNextPage && !search.isFetchingNextPage) void search.fetchNextPage();
          }}
          ListEmptyComponent={
            query === '' ? (
              <EmptyState title={t('home.emptyNearbyTitle')} message={t('home.emptyNearbyBody')} />
            ) : (
              <EmptyState
                title={t('home.emptySearchTitle')}
                message={t('home.emptySearchBody', { query })}
              />
            )
          }
          ListFooterComponent={
            search.isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} style={styles.footer} />
            ) : undefined
          }
        />
      )}
    </Screen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  addressText: {
    flex: 1,
  },
  addressLabel: {
    fontWeight: '600',
  },
  list: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  separator: {
    height: spacing.md,
  },
  footer: {
    padding: spacing.lg,
  },
});
