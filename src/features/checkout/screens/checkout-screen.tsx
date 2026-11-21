import { zodResolver } from '@hookform/resolvers/zod';
import type { UseMutationResult } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { FormScreen } from '@/components/form-screen';
import { LoadingState } from '@/components/loading-state';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { useSelectedAddress } from '@/features/addresses/hooks/use-selected-address';
import type { Address } from '@/features/addresses/types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCart, useCartActions } from '@/features/cart/hooks/use-cart';
import { useCartView } from '@/features/cart/hooks/use-cart-view';
import { useStore } from '@/features/stores/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import { formatDistance, formatRupees } from '@/lib/format';
import { normalizePhone } from '@/lib/phone';
import { radius, spacing } from '@/theme';

import { useCheckoutKey } from '../hooks/use-checkout-key';
import { useDeliveryQuote } from '../hooks/use-delivery-quote';
import { usePlaceOrder } from '../hooks/use-place-order';
import { createCheckoutSchema, type CheckoutFormValues } from '../schemas/checkout.schema';
import type { PlaceOrderInput } from '../services/checkout.service';
import { buildOrderSignature } from '../utils/order-signature';
import { toPlaceOrderErrorKey } from '../utils/place-order-error';

type PlaceOrderMutation = UseMutationResult<number, Error, PlaceOrderInput>;
type RecipientMode = 'me' | 'someone';

/**
 * Checkout: where to deliver, who receives it, the order summary with the delivery fee, and the
 * button that places it. The screen only shows numbers; the database works out the real ones.
 */
export function CheckoutScreen() {
  const router = useRouter();
  const cart = useCart();
  const { clear } = useCartActions();
  const { address, isLoading } = useSelectedAddress();
  const place = usePlaceOrder();

  // The order is in: leave for the order page and only then empty the cart. While `isSuccess` is
  // true this screen shows a spinner, so the empty cart never reaches the "empty cart" redirect.
  useEffect(() => {
    if (place.isSuccess) {
      router.replace({ pathname: '/my-orders/[id]', params: { id: String(place.data) } });
      clear();
    }
  }, [place.isSuccess, place.data, router, clear]);

  if (place.isSuccess || isLoading) return <LoadingState />;
  if (cart.lines.length === 0) return <Redirect href="/cart" />;

  // Keyed by address: choosing another address starts the form again with that address's recipient.
  return <CheckoutForm key={address?.id ?? 'none'} address={address} place={place} />;
}

interface CheckoutFormProps {
  address: Address | null;
  place: PlaceOrderMutation;
}

function CheckoutForm({ address, place }: CheckoutFormProps) {
  const { t } = useTranslation('checkout');
  const { t: tStores } = useTranslation('stores');
  const { t: tCommon } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { profile } = useAuth();
  const cart = useCart();
  const { view } = useCartView();
  const store = useStore(cart.storeId);
  const quote = useDeliveryQuote(
    cart.storeId,
    address ? { latitude: address.latitude, longitude: address.longitude } : null,
  );

  // An address saved "for someone else" starts the form on that person.
  const [mode, setMode] = useState<RecipientMode>(address?.recipientName ? 'someone' : 'me');
  const recipientDefaults = (which: RecipientMode) =>
    which === 'someone'
      ? { name: address?.recipientName ?? '', phone: address?.recipientPhone ?? '' }
      : { name: profile?.fullName ?? '', phone: profile?.phone ?? '' };

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(createCheckoutSchema(t)),
    defaultValues: {
      recipientName: recipientDefaults(mode).name,
      recipientPhone: recipientDefaults(mode).phone,
      notes: '',
    },
    mode: 'onTouched',
  });
  const {
    control,
    handleSubmit,
    setFocus,
    setValue,
    formState: { errors },
  } = form;

  function chooseMode(next: RecipientMode): void {
    setMode(next);
    setValue('recipientName', recipientDefaults(next).name);
    setValue('recipientPhone', recipientDefaults(next).phone);
  }

  // The idempotency key stays the same while the order is unchanged, so a retry after a lost
  // connection cannot create a second order.
  const typed = useWatch({ control });
  const idempotencyKey = useCheckoutKey(
    buildOrderSignature({
      storeId: cart.storeId,
      lines: cart.lines,
      addressId: address?.id ?? null,
      recipientName: typed.recipientName ?? '',
      recipientPhone: typed.recipientPhone ?? '',
      notes: typed.notes ?? '',
    }),
  );

  const fee = quote.data?.deliveryFee ?? null;
  const total = fee === null ? null : Math.round((view.subtotal + fee) * 100) / 100;
  const storeIsClosed = store.data ? !store.data.isOpen : false;
  const canPlace =
    address !== null && fee !== null && view.canCheckout && store.data?.isOpen === true;

  const submit = handleSubmit((values) => {
    if (!address || cart.storeId === null) return;
    const notes = values.notes.trim();
    place.mutate({
      storeId: cart.storeId,
      items: cart.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      recipientName: values.recipientName.trim(),
      recipientPhone: normalizePhone(values.recipientPhone),
      addressLine: address.addressLine,
      area: address.area,
      city: address.city,
      instructions: address.instructions,
      latitude: address.latitude,
      longitude: address.longitude,
      notes: notes === '' ? null : notes,
      idempotencyKey,
    });
  });

  const distance = quote.data ? formatDistance(quote.data.distanceM) : null;

  return (
    <FormScreen edges={['bottom', 'left', 'right']}>
      <Section title={t('deliverTo')}>
        {address ? (
          <>
            <Text style={styles.strong}>{address.label}</Text>
            <Text>{address.addressLine}</Text>
            <Text variant="caption" tone="muted">
              {[address.area, address.city].filter(Boolean).join(', ')}
            </Text>
            <Button
              label={t('change')}
              variant="secondary"
              onPress={() => router.push('/addresses')}
            />
          </>
        ) : (
          <>
            <Text tone="muted">{t('noAddress')}</Text>
            <Button label={t('addAddress')} onPress={() => router.push('/addresses/new')} />
          </>
        )}
      </Section>

      <Section title={t('recipient.title')}>
        <View style={styles.modeRow}>
          <View style={styles.modeButton}>
            <Button
              label={t('recipient.forMe')}
              variant={mode === 'me' ? 'primary' : 'secondary'}
              selected={mode === 'me'}
              onPress={() => chooseMode('me')}
            />
          </View>
          <View style={styles.modeButton}>
            <Button
              label={t('recipient.forSomeone')}
              variant={mode === 'someone' ? 'primary' : 'secondary'}
              selected={mode === 'someone'}
              onPress={() => chooseMode('someone')}
            />
          </View>
        </View>
        <Controller
          control={control}
          name="recipientName"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label={t('recipient.name.label')}
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
              label={t('recipient.phone.label')}
              error={errors.recipientPhone?.message}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              keyboardType="phone-pad"
              autoComplete="tel"
              returnKeyType="next"
              onSubmitEditing={() => setFocus('notes')}
            />
          )}
        />
        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label={t('notes.label')}
              hint={t('notes.hint')}
              error={errors.notes?.message}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              multiline
            />
          )}
        />
      </Section>

      <Section title={t('summary.title')}>
        <Row label={t('summary.subtotal')} value={formatRupees(view.subtotal)} />
        <Row
          label={t('summary.deliveryFee')}
          value={
            fee !== null
              ? formatRupees(fee)
              : quote.isError
                ? '—'
                : address
                  ? t('summary.calculating')
                  : '—'
          }
        />
        {distance ? (
          <Text variant="caption" tone="muted">
            {t('summary.distance', {
              distance: distance.value,
              unit: tCommon(`units.${distance.unit}`),
            })}
          </Text>
        ) : null}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Row label={t('summary.total')} value={total === null ? '—' : formatRupees(total)} strong />
        <Text variant="caption" tone="muted">
          {t('summary.payment')}
        </Text>
      </Section>

      {quote.isError ? <ErrorBanner message={t('summary.feeUnavailable')} /> : null}
      {storeIsClosed ? <ErrorBanner message={tStores('store.closedBanner')} /> : null}
      {view.hasUnavailable ? <ErrorBanner message={t('cartProblem')} /> : null}
      {place.isError ? (
        <ErrorBanner message={t(`errors.${toPlaceOrderErrorKey(place.error)}`)} />
      ) : null}

      {view.hasUnavailable || place.isError ? (
        <Button
          label={t('reviewCart')}
          variant="secondary"
          onPress={() => router.navigate('/cart')}
        />
      ) : null}
      <Button
        label={t('place')}
        loading={place.isPending}
        disabled={!canPlace}
        onPress={() => void submit()}
      />
    </FormScreen>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Text accessibilityRole="header" style={styles.strong}>
        {title}
      </Text>
      {children}
    </View>
  );
}

interface RowProps {
  label: string;
  value: string;
  strong?: boolean;
}

function Row({ label, value, strong = false }: RowProps) {
  return (
    <View style={styles.row}>
      <Text style={strong ? styles.strong : undefined}>{label}</Text>
      <Text style={strong ? styles.strong : undefined}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  strong: {
    fontWeight: '600',
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeButton: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
