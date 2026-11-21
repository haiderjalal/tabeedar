import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

import { USER_ROLES, type UserRole } from '../types';

interface RolePickerProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
}

/**
 * Lets a new user say how they will use Tabeedar. Exposed to screen readers as a single choice
 * out of three (radio group), not as three unrelated buttons.
 */
export function RolePicker({ value, onChange }: RolePickerProps) {
  const { t } = useTranslation('auth');
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t('signUp.roleLabel')}
      style={styles.group}
    >
      {USER_ROLES.map((role) => {
        const isSelected = role === value;
        const title = t(`roles.${role}.title`);
        const description = t(`roles.${role}.description`);

        return (
          <Pressable
            key={role}
            role="radio"
            accessibilityLabel={`${title}. ${description}`}
            // `aria-checked` (not accessibilityState) so the state is announced on web as well.
            aria-checked={isSelected}
            onPress={() => onChange(role)}
            style={[
              styles.option,
              {
                borderColor: isSelected ? colors.primary : colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Text style={styles.title}>{title}</Text>
            <Text variant="caption" tone="muted">
              {description}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.sm,
  },
  option: {
    // A thicker border marks the choice, so colour is not the only signal.
    borderWidth: 2,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    fontWeight: '600',
  },
});
