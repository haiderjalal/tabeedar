import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Side-effect import: sets up translations and text direction before any screen renders.
import '@/lib/i18n';
import { AppNavigator } from '@/features/auth/components/app-navigator';
import { AuthProvider } from '@/features/auth/components/auth-provider';
import { NotificationsBridge } from '@/features/notifications/components/notifications-bridge';
import { useTheme } from '@/hooks/use-theme';
import { QueryProvider } from '@/lib/query/query-provider';

/** Root layout: wraps every screen in the app-wide providers. */
export default function RootLayout() {
  const { colors, isDark } = useTheme();

  // Align the navigation chrome (headers, tab bars, backgrounds) with our design tokens.
  const base = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <QueryProvider>
      <ThemeProvider value={navigationTheme}>
        <AuthProvider>
          <StatusBar style="auto" />
          <NotificationsBridge />
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
