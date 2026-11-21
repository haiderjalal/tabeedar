import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { spacing } from '@/theme';

import type { ImageKind } from '../constants';
import { useChoosePicture } from '../hooks/use-choose-picture';
import { toMediaErrorKey } from '../utils/media-error';

import { Picture } from './picture';

interface ImageFieldProps {
  /** What the picture is, e.g. "Logo". Also names the buttons for screen readers. */
  label: string;
  kind: ImageKind;
  storeId: number;
  /** The current picture's path, or null when there is none. */
  path: string | null;
  /** Called with the new path after a successful upload, or null when the picture is removed. */
  onChange: (path: string | null) => void;
}

const SQUARE_SIZE = 96;
const COVER_HEIGHT = 140;

/**
 * A form field for one picture: shows it, and lets the owner choose a new one or remove it.
 * Choosing uploads straight away; the form only stores the resulting path, so saving the form
 * stays a plain text save.
 */
export function ImageField({ label, kind, storeId, path, onChange }: ImageFieldProps) {
  const { t } = useTranslation('media');
  const choose = useChoosePicture();
  const isCover = kind === 'cover';

  function chooseNew(): void {
    choose.mutate(
      { storeId, kind },
      {
        onSuccess: (newPath) => {
          // null means the picker was closed without choosing; keep what is there.
          if (newPath !== null) onChange(newPath);
        },
      },
    );
  }

  return (
    <View style={styles.field}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Picture
        path={path}
        width={isCover ? '100%' : SQUARE_SIZE}
        height={isCover ? COVER_HEIGHT : SQUARE_SIZE}
      />
      <View style={styles.actions}>
        <Button
          label={path ? t('change') : t('choose')}
          accessibilityLabel={
            path ? t('changeLabel', { name: label }) : t('chooseLabel', { name: label })
          }
          variant="secondary"
          loading={choose.isPending}
          onPress={chooseNew}
        />
        {path ? (
          <Button
            label={t('remove')}
            accessibilityLabel={t('removeLabel', { name: label })}
            variant="ghost"
            disabled={choose.isPending}
            onPress={() => onChange(null)}
          />
        ) : null}
      </View>
      {choose.isError ? (
        <Text variant="caption" tone="danger" accessibilityRole="alert">
          {t(`errors.${toMediaErrorKey(choose.error)}`)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
