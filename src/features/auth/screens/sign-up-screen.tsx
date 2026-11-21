import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { FormScreen } from '@/components/form-screen';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { useLanguage } from '@/hooks/use-language';
import { spacing } from '@/theme';

import { RolePicker } from '../components/role-picker';
import { MIN_PASSWORD_LENGTH } from '../constants';
import { useSignUp } from '../hooks/use-sign-up';
import { createSignUpSchema, type SignUpValues } from '../schemas/sign-up.schema';
import { toAuthErrorKey } from '../utils/auth-error';

/**
 * Account creation. The person picks how they will use the app (customer, store or rider) and
 * gives their contact details. If email confirmation is on, a "check your email" message replaces
 * the form; otherwise they are signed in and the navigator takes over.
 */
export function SignUpScreen() {
  const { t } = useTranslation('auth');
  const { language } = useLanguage();
  const router = useRouter();
  const signUp = useSignUp();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(createSignUpSchema(t)),
    defaultValues: { role: 'customer', fullName: '', phone: '', email: '', password: '' },
    mode: 'onTouched',
  });

  const submit = handleSubmit((values) => signUp.mutate({ ...values, language }));

  if (signUp.data?.needsEmailConfirmation) {
    return (
      <FormScreen>
        <View style={styles.heading}>
          <Text variant="title" accessibilityRole="header">
            {t('signUp.confirmEmail.title')}
          </Text>
          <Text tone="muted">
            {t('signUp.confirmEmail.body', { email: signUp.variables?.email.trim() ?? '' })}
          </Text>
        </View>
        <Button
          label={t('signUp.confirmEmail.goToSignIn')}
          onPress={() => router.replace('/sign-in')}
        />
      </FormScreen>
    );
  }

  return (
    <FormScreen>
      <LanguageSwitcher />

      <View style={styles.heading}>
        <Text variant="title" accessibilityRole="header">
          {t('signUp.title')}
        </Text>
        <Text tone="muted">{t('signUp.subtitle')}</Text>
      </View>

      <Controller
        control={control}
        name="role"
        render={({ field }) => <RolePicker value={field.value} onChange={field.onChange} />}
      />

      <View style={styles.fields}>
        <Controller
          control={control}
          name="fullName"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label={t('fields.fullName.label')}
              error={errors.fullName?.message}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => setFocus('phone')}
            />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label={t('fields.phone.label')}
              hint={t('fields.phone.hint')}
              error={errors.phone?.message}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType="next"
              onSubmitEditing={() => setFocus('email')}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label={t('fields.email.label')}
              error={errors.email?.message}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => setFocus('password')}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label={t('fields.password.label')}
              hint={t('fields.password.hint', { min: MIN_PASSWORD_LENGTH })}
              error={errors.password?.message}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={() => void submit()}
              trailing={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? t('fields.password.hide') : t('fields.password.show')
                  }
                  onPress={() => setShowPassword((shown) => !shown)}
                  hitSlop={spacing.sm}
                >
                  <Text tone="primary">
                    {showPassword ? t('fields.password.hide') : t('fields.password.show')}
                  </Text>
                </Pressable>
              }
            />
          )}
        />
      </View>

      {signUp.isError ? (
        <ErrorBanner message={t(`errors.${toAuthErrorKey(signUp.error)}`)} />
      ) : null}

      <Button label={t('signUp.submit')} loading={signUp.isPending} onPress={() => void submit()} />

      <View style={styles.switch}>
        <Text tone="muted">{t('signUp.haveAccount')}</Text>
        <Button
          label={t('signUp.goToSignIn')}
          variant="ghost"
          onPress={() => router.replace('/sign-in')}
        />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: spacing.xs,
  },
  fields: {
    gap: spacing.lg,
  },
  switch: {
    alignItems: 'center',
  },
});
