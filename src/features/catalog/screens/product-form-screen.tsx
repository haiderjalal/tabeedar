import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ErrorBanner } from '@/components/error-banner';
import { ErrorState } from '@/components/error-state';
import { FormScreen } from '@/components/form-screen';
import { LoadingState } from '@/components/loading-state';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { ImageField } from '@/features/media/components/image-field';
import { useMyStore } from '@/features/shop/hooks/use-my-store';
import { useCatalog } from '@/features/stores/hooks/use-catalog';
import type { Category, Product } from '@/features/stores/types';
import { useGoBack } from '@/hooks/use-go-back';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

import { CategoryChooser } from '../components/category-chooser';
import { useDeleteProduct, useSaveProduct } from '../hooks/use-product-mutations';
import { createProductFormSchema } from '../schemas/catalog.schema';
import { toCatalogErrorKey } from '../utils/catalog-error';
import {
  EMPTY_PRODUCT_FORM,
  toProductFormValues,
  type ProductFormValues,
} from '../utils/product-payload';

interface ProductFormScreenProps {
  /** Omit to add a new product. */
  productId?: number;
}

/** Add a new product or edit an existing one. Loads the catalog first so edits start filled in. */
export function ProductFormScreen({ productId }: ProductFormScreenProps) {
  const { t } = useTranslation('catalog');
  const store = useMyStore();

  if (store.isPending) return <LoadingState />;
  if (store.isError || !store.data) {
    return <ErrorState message={t('list.loadError')} onRetry={() => void store.refetch()} />;
  }
  return <ProductFormLoader storeId={store.data.id} productId={productId} />;
}

interface ProductFormLoaderProps {
  storeId: number;
  productId?: number;
}

function ProductFormLoader({ storeId, productId }: ProductFormLoaderProps) {
  const { t } = useTranslation('catalog');
  const catalog = useCatalog(storeId);

  if (catalog.isPending) return <LoadingState />;
  if (catalog.isError) {
    return <ErrorState message={t('list.loadError')} onRetry={() => void catalog.refetch()} />;
  }

  const existing =
    productId === undefined ? undefined : catalog.data.products.find((p) => p.id === productId);
  // Editing a product that no longer exists (deleted elsewhere): go back to the list.
  if (productId !== undefined && !existing) return <Redirect href="/catalog" />;

  return <ProductForm storeId={storeId} categories={catalog.data.categories} existing={existing} />;
}

interface ProductFormProps {
  storeId: number;
  categories: Category[];
  existing: Product | undefined;
}

function ProductForm({ storeId, categories, existing }: ProductFormProps) {
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation();
  const { colors } = useTheme();
  const goBack = useGoBack('/catalog');
  const save = useSaveProduct(storeId);
  const remove = useDeleteProduct(storeId);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const {
    control,
    handleSubmit,
    setFocus,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(createProductFormSchema(t)),
    defaultValues: existing ? toProductFormValues(existing) : EMPTY_PRODUCT_FORM,
    mode: 'onTouched',
  });

  // `useWatch` (not `watch`) so the React Compiler can still optimise this component.
  const imagePath = useWatch({ control, name: 'imagePath' });
  const categoryId = useWatch({ control, name: 'categoryId' });

  const submit = handleSubmit((values) =>
    save.mutate({ values, previous: existing }, { onSuccess: goBack }),
  );

  const failure = save.isError ? save.error : remove.isError ? remove.error : null;

  return (
    <FormScreen edges={['bottom', 'left', 'right']}>
      <ImageField
        label={t('product.form.photo')}
        kind="product"
        storeId={storeId}
        path={imagePath}
        onChange={(path) => setValue('imagePath', path, { shouldDirty: true })}
      />

      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField
            ref={field.ref}
            label={t('product.form.name.label')}
            error={errors.name?.message}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            returnKeyType="next"
            onSubmitEditing={() => setFocus('priceText')}
          />
        )}
      />
      <Controller
        control={control}
        name="priceText"
        render={({ field }) => (
          <TextField
            ref={field.ref}
            label={t('product.form.price.label')}
            hint={t('product.form.price.hint')}
            error={errors.priceText?.message}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            keyboardType="decimal-pad"
            returnKeyType="next"
            onSubmitEditing={() => setFocus('description')}
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextField
            ref={field.ref}
            label={t('product.form.description.label')}
            hint={t('product.form.description.hint')}
            error={errors.description?.message}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            multiline
          />
        )}
      />

      <CategoryChooser
        label={t('product.form.category.label')}
        noneLabel={t('product.form.category.none')}
        categories={categories}
        value={categoryId}
        onChange={(value) => setValue('categoryId', value, { shouldDirty: true })}
      />

      <Controller
        control={control}
        name="isAvailable"
        render={({ field }) => (
          <View style={styles.field}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('product.form.inStock')}</Text>
              <Switch
                accessibilityLabel={t('product.form.inStock')}
                value={field.value}
                onValueChange={field.onChange}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            </View>
            <Text variant="caption" tone="muted">
              {t('product.form.inStockHint')}
            </Text>
          </View>
        )}
      />

      {failure ? <ErrorBanner message={t(`errors.${toCatalogErrorKey(failure)}`)} /> : null}

      <Button
        label={t('product.form.save')}
        loading={save.isPending}
        onPress={() => void submit()}
      />
      <Button label={tCommon('actions.cancel')} variant="ghost" onPress={goBack} />
      {existing ? (
        <Button
          label={t('product.form.delete')}
          variant="danger"
          onPress={() => setIsConfirmingDelete(true)}
        />
      ) : null}

      <ConfirmDialog
        visible={isConfirmingDelete}
        title={t('product.deleteConfirm.title')}
        message={t('product.deleteConfirm.body', { name: existing?.name ?? '' })}
        confirmLabel={t('product.deleteConfirm.confirm')}
        cancelLabel={t('product.deleteConfirm.keep')}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!existing) return;
          remove.mutate(existing, {
            onSuccess: () => {
              setIsConfirmingDelete(false);
              goBack();
            },
            onError: () => setIsConfirmingDelete(false),
          });
        }}
        onCancel={() => setIsConfirmingDelete(false)}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  switchLabel: {
    flex: 1,
  },
});
