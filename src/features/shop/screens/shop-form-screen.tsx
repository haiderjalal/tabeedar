import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { FormScreen } from '@/components/form-screen';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { LocationPicker } from '@/features/location/components/location-picker';
import { ImageField } from '@/features/media/components/image-field';
import { useGoBack } from '@/hooks/use-go-back';

import { useSaveStore } from '../hooks/use-my-store';
import { createShopFormSchema } from '../schemas/shop.schema';
import type { MyStore } from '../types';
import { toShopErrorKey } from '../utils/shop-error';
import type { ShopFormValues } from '../utils/shop-payload';

interface ShopFormScreenProps {
  /** The store being edited. Null while a new account sets its store up for the first time. */
  existing: MyStore | null;
}

/**
 * The store's details form, used both to set the store up and to edit it afterwards. Pictures can
 * only be added to an existing store (their storage paths contain the store's id), so the setup
 * form has none; they appear as soon as the store is created.
 */
export function ShopFormScreen({ existing }: ShopFormScreenProps) {
  const { t } = useTranslation('shop');
  const { t: tCommon } = useTranslation();
  const goBack = useGoBack('/my-store');
  const save = useSaveStore();

  const {
    control,
    handleSubmit,
    setFocus,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ShopFormValues>({
    resolver: zodResolver(createShopFormSchema(t)),
    defaultValues: {
      name: existing?.name ?? '',
      description: existing?.description ?? '',
      phone: existing?.phone ?? '',
      addressLine: existing?.addressLine ?? '',
      area: existing?.area ?? '',
      city: existing?.city ?? '',
      latitude: existing?.latitude ?? null,
      longitude: existing?.longitude ?? null,
      logoPath: existing?.logoPath ?? null,
      coverPath: existing?.coverPath ?? null,
    },
    mode: 'onTouched',
  });

  // `useWatch` (not `watch`) so the React Compiler can still optimise this component.
  const latitude = useWatch({ control, name: 'latitude' });
  const longitude = useWatch({ control, name: 'longitude' });
  const logoPath = useWatch({ control, name: 'logoPath' });
  const coverPath = useWatch({ control, name: 'coverPath' });

  const submit = handleSubmit((values) =>
    save.mutate(
      { values, previous: existing },
      {
        // Creating the store opens the rest of the store area by itself; editing returns to it.
        onSuccess: () => {
          if (existing) goBack();
        },
      },
    ),
  );

  return (
    <FormScreen edges={['bottom', 'left', 'right']}>
      {existing === null ? (
        <>
          <Text variant="heading" accessibilityRole="header">
            {t('setup.title')}
          </Text>
          <Text tone="muted">{t('setup.intro')}</Text>
        </>
      ) : (
        <>
          <ImageField
            label={t('form.logo')}
            kind="logo"
            storeId={existing.id}
            path={logoPath}
            onChange={(path) => setValue('logoPath', path, { shouldDirty: true })}
          />
          <ImageField
            label={t('form.cover')}
            kind="cover"
            storeId={existing.id}
            path={coverPath}
            onChange={(path) => setValue('coverPath', path, { shouldDirty: true })}
          />
        </>
      )}

      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField
            ref={field.ref}
            label={t('form.name.label')}
            error={errors.name?.message}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
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
            label={t('form.description.label')}
            hint={t('form.description.hint')}
            error={errors.description?.message}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            multiline
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <TextField
            ref={field.ref}
            label={t('form.phone.label')}
            error={errors.phone?.message}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
        )}
      />
      <Controller
        control={control}
        name="addressLine"
        render={({ field }) => (
          <TextField
            ref={field.ref}
            label={t('form.addressLine.label')}
            hint={t('form.addressLine.hint')}
            error={errors.addressLine?.message}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            autoComplete="street-address"
            returnKeyType="next"
            onSubmitEditing={() => setFocus('area')}
          />
        )}
      />
      <Controller
        control={control}
        name="area"
        render={({ field }) => (
          <TextField
            ref={field.ref}
            label={t('form.area.label')}
            hint={t('form.area.hint')}
            error={errors.area?.message}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            returnKeyType="next"
            onSubmitEditing={() => setFocus('city')}
          />
        )}
      />
      <Controller
        control={control}
        name="city"
        render={({ field }) => (
          <TextField
            ref={field.ref}
            label={t('form.city.label')}
            error={errors.city?.message}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      <LocationPicker
        value={latitude !== null && longitude !== null ? { latitude, longitude } : null}
        onChange={(coordinates) => {
          // Set both first, then validate once, so no stale "set the map position" message is left.
          setValue('latitude', coordinates.latitude, { shouldDirty: true });
          setValue('longitude', coordinates.longitude, { shouldDirty: true });
          void trigger('latitude');
        }}
        hint={t('form.locationHint')}
        error={errors.latitude?.message}
      />

      {save.isError ? <ErrorBanner message={t(`errors.${toShopErrorKey(save.error)}`)} /> : null}

      <Button
        label={existing ? t('form.save') : t('setup.create')}
        loading={save.isPending}
        onPress={() => void submit()}
      />
      {existing ? (
        <Button label={tCommon('actions.cancel')} variant="ghost" onPress={goBack} />
      ) : null}
    </FormScreen>
  );
}
