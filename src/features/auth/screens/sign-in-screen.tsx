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
import { spacing } from '@/theme';

import { useSignIn } from '../hooks/use-sign-in';
import { createSignInSchema, type SignInValues } from '../schemas/sign-in.schema';
import { toAuthErrorKey } from '../utils/auth-error';

/** Email and password sign-in. After success the navigator moves the person to their area. */
export function SignInScreen() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const signIn = useSignIn();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(createSignInSchema(t)),
    defaultValues: { email: '', password: '' },
    // Validate a field when the person leaves it, then keep it up to date as they type.
    mode: 'onTouched',
  });

  const submit = handleSubmit((values) => signIn.mutate(values));

  return (
    <FormScreen>
      <LanguageSwitcher />

      <View style={styles.heading}>
        <Text variant="title" accessibilityRole="header">
          {t('signIn.title')}
        </Text>
        <Text tone="muted">{t('signIn.subtitle')}</Text>
      </View>

      <View style={styles.fields}>
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
              textContentType="username"
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
              error={errors.password?.message}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
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

      {signIn.isError ? (
        <ErrorBanner message={t(`errors.${toAuthErrorKey(signIn.error)}`)} />
      ) : null}

      <Button label={t('signIn.submit')} loading={signIn.isPending} onPress={() => void submit()} />

      <View style={styles.switch}>
        <Text tone="muted">{t('signIn.noAccount')}</Text>
        <Button
          label={t('signIn.goToSignUp')}
          variant="ghost"
          onPress={() => router.replace('/sign-up')}
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
