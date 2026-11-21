import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { ErrorState } from '@/components/error-state';
import { FormScreen } from '@/components/form-screen';
import { LoadingState } from '@/components/loading-state';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { LocationPicker } from '@/features/location/components/location-picker';
import { useGoBack } from '@/hooks/use-go-back';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

import { useAddresses, useSaveAddress } from '../hooks/use-addresses';
import { createAddressFormSchema } from '../schemas/address.schema';
import { useSelectedAddressStore } from '../store/selected-address-store';
import type { Address } from '../types';
import type { AddressFormValues } from '../utils/address-payload';

interface AddressFormScreenProps {
  /** Omit to add a new address. */
  addressId?: number;
}

/** Add a new address or edit an existing one. Loads the saved addresses first so edits start filled in. */
export function AddressFormScreen({ addressId }: AddressFormScreenProps) {
  const { t } = useTranslation('addresses');
  const addresses = useAddresses();

  if (addresses.isPending) return <LoadingState />;
  if (addresses.isError) {
    return <ErrorState message={t('list.loadError')} onRetry={() => void addresses.refetch()} />;
  }

  const existing =
    addressId === undefined ? undefined : addresses.data.find((a) => a.id === addressId);
  // Editing an address that no longer exists (deleted elsewhere): go back to the list.
  if (addressId !== undefined && !existing) return <Redirect href="/addresses" />;

  return <AddressForm existing={existing} isFirstAddress={addresses.data.length === 0} />;
}

interface AddressFormProps {
  existing: Address | undefined;
  isFirstAddress: boolean;
}

function AddressForm({ existing, isFirstAddress }: AddressFormProps) {
  const { t } = useTranslation('addresses');
  const { t: tCommon } = useTranslation();
  const { colors } = useTheme();
  // After saving or cancelling, return to the list (or wherever the customer came from).
  const goBack = useGoBack('/addresses');
  const save = useSaveAddress();
  const select = useSelectedAddressStore((state) => state.select);

  const {
    control,
    handleSubmit,
    setFocus,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(createAddressFormSchema(t)),
    defaultValues: {
      label: existing?.label ?? '',
      recipientName: existing?.recipientName ?? '',
      recipientPhone: existing?.recipientPhone ?? '',
      addressLine: existing?.addressLine ?? '',
      area: existing?.area ?? '',
      city: existing?.city ?? '',
      instructions: existing?.instructions ?? '',
      latitude: existing?.latitude ?? null,
      longitude: existing?.longitude ?? null,
      // A customer's first address is their default without having to ask.
      isDefault: existing?.isDefault ?? isFirstAddress,
    },
    mode: 'onTouched',
  });

  // `useWatch` (not `watch`) so the React Compiler can still optimise this component.
  const latitude = useWatch({ control, name: 'latitude' });
  const longitude = useWatch({ control, name: 'longitude' });

  const submit = handleSubmit((values) =>
    save.mutate(
      { values, addressId: existing?.id },
      {
        onSuccess: (saved) => {
          // A newly saved address is the one the customer wants to use now.
          select(saved.id);
          goBack();
        },
      },
    ),
  );

  return (
    <FormScreen edges={['bottom', 'left', 'right']}>
      <Controller
        control={control}
        name="label"
        render={({ field }) => (
          <TextField
            ref={field.ref}
            label={t('form.label.label')}
            hint={t('form.label.hint')}
            error={errors.label?.message}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            returnKeyType="next"
            onSubmitEditing={() => setFocus('addressLine')}
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
            returnKeyType="next"
            onSubmitEditing={() => setFocus('instructions')}
          />
        )}
      />
      <Controller
        control={control}
        name="instructions"
        render={({ field }) => (
          <TextField
            ref={field.ref}
            label={t('form.instructions.label')}
            hint={t('form.instructions.hint')}
            error={errors.instructions?.message}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            multiline
            returnKeyType="next"
          />
        )}
      />

      <LocationPicker
        value={latitude !== null && longitude !== null ? { latitude, longitude } : null}
        onChange={(coordinates) => {
          // Set both first, then validate once: validating after only one of them is set would
          // leave a stale "set the map position" message behind.
          setValue('latitude', coordinates.latitude, { shouldDirty: true });
          setValue('longitude', coordinates.longitude, { shouldDirty: true });
          void trigger('latitude');
        }}
        hint={t('form.locationHint')}
        error={errors.latitude?.message}
      />

      <Controller
        control={control}
        name="recipientName"
        render={({ field }) => (
          <TextField
            ref={field.ref}
            label={t('form.recipientName.label')}
            hint={t('form.recipientName.hint')}
            error={errors.recipientName?.message}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            autoComplete="name"
            returnKeyType="next"
            onSubmitEditing={() => setFocus('recipientPhone')}
          />
        )}
      />
      <Controller
        control={control}
        name="recipientPhone"
        render={({ field }) => (
          <TextField
            ref={field.ref}
            label={t('form.recipientPhone.label')}
            error={errors.recipientPhone?.message}
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
        name="isDefault"
        render={({ field }) => (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('form.isDefault')}</Text>
            <Switch
              accessibilityLabel={t('form.isDefault')}
              value={field.value}
              onValueChange={field.onChange}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        )}
      />

      {save.isError ? <ErrorBanner message={t('form.saveFailed')} /> : null}

      <Button label={t('form.save')} loading={save.isPending} onPress={() => void submit()} />
      <Button label={tCommon('actions.cancel')} variant="ghost" onPress={goBack} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
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
