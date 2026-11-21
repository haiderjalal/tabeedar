import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { ErrorBanner } from '@/components/error-banner';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { useMyStore } from '@/features/shop/hooks/use-my-store';
import { useCatalog } from '@/features/stores/hooks/use-catalog';
import type { Category } from '@/features/stores/types';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

import { CategoryNameForm } from '../components/category-name-form';
import {
  useCreateCategory,
  useDeleteCategory,
  useRenameCategory,
} from '../hooks/use-category-mutations';
import { toCatalogErrorKey } from '../utils/catalog-error';

/** Add, rename and delete the store's categories. */
export function CategoriesScreen() {
  const { t } = useTranslation('catalog');
  const store = useMyStore();

  if (store.isPending) return <LoadingState />;
  if (store.isError || !store.data) {
    return <ErrorState message={t('categories.loadError')} onRetry={() => void store.refetch()} />;
  }
  return <CategoriesManager storeId={store.data.id} />;
}

interface CategoriesManagerProps {
  storeId: number;
}

function CategoriesManager({ storeId }: CategoriesManagerProps) {
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation();
  const { colors } = useTheme();
  const catalog = useCatalog(storeId);
  const create = useCreateCategory(storeId);
  const rename = useRenameCategory(storeId);
  const remove = useDeleteCategory(storeId);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  if (catalog.isPending) return <LoadingState />;
  if (catalog.isError) {
    return (
      <ErrorState message={t('categories.loadError')} onRetry={() => void catalog.refetch()} />
    );
  }

  const categories = [...catalog.data.categories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );
  // Only the latest problem is shown; starting a new action clears the older ones.
  const failure = [create, rename, remove].find((mutation) => mutation.isError)?.error;

  function clearProblems(): void {
    create.reset();
    rename.reset();
    remove.reset();
  }

  return (
    <Screen edges={['bottom', 'left', 'right']} padded={false}>
      <FlatList
        data={categories}
        keyExtractor={(category) => String(category.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          <View style={styles.header}>
            <CategoryNameForm
              label={t('categories.newLabel')}
              submitLabel={t('categories.add')}
              isSaving={create.isPending}
              onSubmit={(name, onDone) => {
                clearProblems();
                create.mutate(name, { onSuccess: onDone });
              }}
            />
            {failure ? <ErrorBanner message={t(`errors.${toCatalogErrorKey(failure)}`)} /> : null}
          </View>
        }
        renderItem={({ item }) =>
          editingId === item.id ? (
            <View
              style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <CategoryNameForm
                label={t('categories.nameLabel')}
                submitLabel={t('categories.save')}
                initialName={item.name}
                isSaving={rename.isPending}
                onSubmit={(name, onDone) => {
                  clearProblems();
                  rename.mutate(
                    { categoryId: item.id, name },
                    {
                      onSuccess: () => {
                        onDone();
                        setEditingId(null);
                      },
                    },
                  );
                }}
                onCancel={() => setEditingId(null)}
              />
            </View>
          ) : (
            <View
              style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.actions}>
                <Button
                  label={t('categories.edit')}
                  accessibilityLabel={t('categories.editLabel', { name: item.name })}
                  variant="secondary"
                  onPress={() => {
                    clearProblems();
                    setEditingId(item.id);
                  }}
                />
                <Button
                  label={tCommon('actions.delete')}
                  accessibilityLabel={t('categories.deleteLabel', { name: item.name })}
                  variant="ghost"
                  onPress={() => setDeleting(item)}
                />
              </View>
            </View>
          )
        }
        ListEmptyComponent={
          <EmptyState title={t('categories.emptyTitle')} message={t('categories.emptyBody')} />
        }
      />

      <ConfirmDialog
        visible={deleting !== null}
        title={t('categories.deleteConfirm.title')}
        message={t('categories.deleteConfirm.body', { name: deleting?.name ?? '' })}
        confirmLabel={t('categories.deleteConfirm.confirm')}
        cancelLabel={t('categories.deleteConfirm.keep')}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          clearProblems();
          // Close as soon as the answer is in; the list refresh continues in the background.
          remove.mutate(deleting.id, { onSettled: () => setDeleting(null) });
        }}
        onCancel={() => setDeleting(null)}
      />
    </Screen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  name: {
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
