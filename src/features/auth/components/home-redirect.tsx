import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { Screen } from '@/components/screen';
import { useTheme } from '@/hooks/use-theme';

import { useAuth } from '../hooks/use-auth';
import { ROLE_HOME } from '../utils/role-routes';

/**
 * The app's entry route ("/"). Sends each person where they belong: sign-in if nobody is signed in,
 * the problem screen if their profile failed to load, otherwise their role's home screen.
 */
export function HomeRedirect() {
  const { status, role } = useAuth();
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (status === 'loading') {
    return (
      <Screen>
        <ActivityIndicator
          accessibilityLabel={t('loading')}
          color={colors.primary}
          size="large"
          style={styles.spinner}
        />
      </Screen>
    );
  }
  if (status === 'signedOut') return <Redirect href="/sign-in" />;
  if (status === 'error') return <Redirect href="/account-problem" />;
  return role ? <Redirect href={ROLE_HOME[role]} /> : null;
}

const styles = StyleSheet.create({
  spinner: {
    flex: 1,
  },
});
