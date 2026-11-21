import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { useLanguage } from '@/hooks/use-language';
import { LANGUAGES, SUPPORTED_LANGUAGE_CODES } from '@/lib/i18n/config';
import { spacing } from '@/theme';

/**
 * Lets the user pick the app language. Reused by the sign-in screen and every role's
 * settings, so it lives in shared components rather than in a feature.
 */
export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  return (
    <View accessibilityLabel={t('language.label')} style={styles.row}>
      {SUPPORTED_LANGUAGE_CODES.map((code) => (
        <Button
          key={code}
          label={LANGUAGES[code].label}
          variant={code === language ? 'primary' : 'secondary'}
          selected={code === language}
          onPress={() => void changeLanguage(code)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
