import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { spacing } from '@/theme';

import { createCategoryFormSchema } from '../schemas/catalog.schema';

interface CategoryNameFormValues {
  name: string;
}

interface CategoryNameFormProps {
  label: string;
  submitLabel: string;
  /** The name to start with, when renaming. Empty for a new category. */
  initialName?: string;
  isSaving: boolean;
  /** Saves the name. Call `onDone` once it worked, so the form can clear itself. */
  onSubmit: (name: string, onDone: () => void) => void;
  /** Shows a Cancel button (used while renaming). */
  onCancel?: () => void;
}

/** A one-field form for naming a category, used both to add a new one and to rename an existing one. */
export function CategoryNameForm({
  label,
  submitLabel,
  initialName = '',
  isSaving,
  onSubmit,
  onCancel,
}: CategoryNameFormProps) {
  const { t } = useTranslation('catalog');
  const { t: tCommon } = useTranslation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryNameFormValues>({
    resolver: zodResolver(createCategoryFormSchema(t)),
    defaultValues: { name: initialName },
    mode: 'onTouched',
  });

  const submit = handleSubmit((values) =>
    onSubmit(values.name, () => reset({ name: initialName })),
  );

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField
            ref={field.ref}
            label={label}
            error={errors.name?.message}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            returnKeyType="done"
            onSubmitEditing={() => void submit()}
          />
        )}
      />
      <View style={styles.actions}>
        <Button label={submitLabel} loading={isSaving} onPress={() => void submit()} />
        {onCancel ? (
          <Button
            label={tCommon('actions.cancel')}
            variant="ghost"
            disabled={isSaving}
            onPress={onCancel}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
