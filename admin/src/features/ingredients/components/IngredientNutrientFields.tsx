import { useState } from 'react';
import { useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { IngredientFormValues } from '../ingredient.types';
import { NutrientPickerDialog } from './NutrientPickerDialog';

export function IngredientNutrientFields({
  form,
  disabled,
  id,
}: {
  form: UseFormReturn<IngredientFormValues>;
  disabled: boolean;
  id: string;
}): React.JSX.Element {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'nutrientLinks',
  });
  const links = useWatch({ control: form.control, name: 'nutrientLinks' });
  const selectedIds = links.map((link) => link.nutrient.id);
  const errors = form.formState.errors.nutrientLinks;
  return (
    <FieldGroup>
      {!fields.length && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No additional nutrients</EmptyTitle>
            <EmptyDescription>Add active nutrients if needed.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {fields.map((field, index) => {
        const fieldId = `${id}-nutrient-${field.nutrient.id}`;
        const failure =
          errors?.[index]?.amount ?? errors?.[index]?.nutrient?.id;
        return (
          <Field
            key={field.id}
            data-invalid={Boolean(failure)}
            data-disabled={disabled}
          >
            <FieldLabel htmlFor={fieldId}>
              {field.nutrient.name} ({field.nutrient.unit} / 100g)
            </FieldLabel>
            {!field.nutrient.isActive && (
              <Badge variant='secondary'>Inactive</Badge>
            )}
            <Input
              id={fieldId}
              {...form.register(`nutrientLinks.${index}.amount`)}
              inputMode='decimal'
              readOnly={!field.nutrient.isActive}
              disabled={disabled}
              aria-invalid={Boolean(failure)}
              aria-describedby={`${fieldId}-help${failure ? ` ${fieldId}-error` : ''}`}
            />
            <FieldDescription id={`${fieldId}-help`}>
              {field.nutrient.isActive
                ? 'Enter a non-negative amount with up to 4 decimal places.'
                : 'Historical amount is read-only. Remove this link explicitly if no longer needed.'}
            </FieldDescription>
            <FieldError
              id={`${fieldId}-error`}
              errors={[failure]}
            />
            <Button
              type='button'
              variant='outline'
              disabled={disabled}
              onClick={() => remove(index)}
              aria-label={`Remove ${field.nutrient.name}`}
            >
              Remove
            </Button>
          </Field>
        );
      })}
      <FieldError
        id={`${id}-nutrients-error`}
        errors={[errors, errors?.root]}
      />
      <Button
        id={`${id}-add-nutrient`}
        type='button'
        variant='outline'
        disabled={disabled}
        aria-describedby={
          errors?.message || errors?.root ? `${id}-nutrients-error` : undefined
        }
        onClick={() => setPickerOpen(true)}
      >
        Add nutrient
      </Button>
      <NutrientPickerDialog
        open={pickerOpen && !disabled}
        onOpenChange={setPickerOpen}
        selectedIds={selectedIds}
        onSelect={(nutrient) => {
          if (
            nutrient.isActive &&
            !form
              .getValues('nutrientLinks')
              .some((link) => link.nutrient.id === nutrient.id)
          )
            append({ nutrient, amount: '' });
        }}
      />
    </FieldGroup>
  );
}
