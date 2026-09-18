import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useId, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { normalizeIngredientApiError } from '../api/ingredient-adapter';
import type { IngredientApiError } from '../api/ingredient-transport';
import {
  createIngredientDefaults,
  ingredientToFormValues,
  toIngredientSaveInput,
} from '../ingredient-form';
import { ingredientFormSchema } from '../ingredient.schema';
import type {
  Ingredient,
  IngredientFormValues,
  IngredientSaveInput,
} from '../ingredient.types';
import { IngredientNutrientFields } from './IngredientNutrientFields';

export interface IngredientFormProps {
  ingredient?: Ingredient;
  onSubmit(input: IngredientSaveInput): Promise<void>;
  onCancel(): void;
  isPending: boolean;
  error: IngredientApiError | null;
  onDirtyChange(dirty: boolean): void;
}
const macros = [
  ['calPer100g', 'Calories (kcal / 100g)'],
  ['proPer100g', 'Protein (g / 100g)'],
  ['carbPer100g', 'Carbohydrate (g / 100g)'],
  ['fatPer100g', 'Fat (g / 100g)'],
] as const;

export function IngredientForm({
  ingredient,
  onSubmit,
  onCancel,
  isPending,
  error,
  onDirtyChange,
}: IngredientFormProps): React.JSX.Element {
  const id = useId();
  const submitting = useRef(false);
  // RHF captures defaults once. The page keys each record/mode; remote refetches
  // deliberately never reset this user's draft or its historical nutrient links.
  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: ingredient
      ? ingredientToFormValues(ingredient)
      : createIngredientDefaults(),
  });
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    getValues,
    clearErrors,
    formState: { errors, isDirty, isSubmitting },
  } = form;
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);
  const locked = isPending || isSubmitting;
  const unconfigured = error?.status === 'NOT_CONFIGURED';
  const applyFailure = useCallback(
    (failure: IngredientApiError) => {
      const entries = Object.entries(failure.fieldErrors ?? {}) as Array<
        [keyof IngredientFormValues, string]
      >;
      for (const [field, message] of entries)
        setError(field, { type: 'server', message });
      if (entries.length) {
        const first = entries[0][0];
        if (first === 'nutrientLinks') {
          if (getValues('nutrientLinks').length)
            setFocus('nutrientLinks.0.amount');
          else document.getElementById(`${id}-add-nutrient`)?.focus();
        } else setFocus(first);
      } else
        setError('root.server', { type: 'server', message: failure.message });
    },
    [getValues, id, setError, setFocus],
  );
  useEffect(() => {
    if (error) applyFailure(error);
  }, [error, applyFailure]);

  async function submit(values: IngredientFormValues) {
    if (submitting.current || isPending || unconfigured) return;
    submitting.current = true;
    clearErrors();
    try {
      await onSubmit(toIngredientSaveInput(values));
    } catch (caught) {
      applyFailure(normalizeIngredientApiError(caught));
    } finally {
      submitting.current = false;
    }
  }

  function textField(
    name: 'name' | 'unit' | 'defaultWeightPerServing',
    label: string,
  ) {
    const fieldId = `${id}-${name}`;
    return (
      <Field
        data-invalid={Boolean(errors[name])}
        data-disabled={locked}
      >
        <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
        <Input
          id={fieldId}
          {...register(name)}
          disabled={locked}
          inputMode={name === 'defaultWeightPerServing' ? 'decimal' : undefined}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={
            errors[name]
              ? `${fieldId}-error`
              : name === 'defaultWeightPerServing'
                ? `${fieldId}-help`
                : undefined
          }
        />
        {name === 'defaultWeightPerServing' && (
          <FieldDescription id={`${fieldId}-help`}>
            Metadata only: this weight does not convert the values below.
            Serving-based entry is not available; enter nutrition per 100g.
          </FieldDescription>
        )}
        <FieldError
          id={`${fieldId}-error`}
          errors={[errors[name]]}
        />
      </Field>
    );
  }
  const generalError =
    errors.root?.server?.message ??
    (!error?.fieldErrors ? error?.message : undefined);
  return (
    <form
      noValidate
      aria-busy={locked}
      onSubmit={handleSubmit(submit)}
      className='flex flex-col gap-6'
    >
      <Card>
        <CardHeader>
          <CardTitle>Basic information</CardTitle>
          <CardDescription>
            Manage a system ingredient and its serving metadata.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {textField('name', 'Name')}
            {textField('unit', 'Unit')}
            {textField(
              'defaultWeightPerServing',
              'Default weight per serving (g)',
            )}
            {ingredient?.imageUrl && (
              <Field>
                <FieldLabel>Existing image (read-only)</FieldLabel>
                <img
                  src={ingredient.imageUrl}
                  alt={ingredient.name}
                  className='max-h-48 max-w-48 object-contain'
                />
                <FieldDescription>
                  Image upload is not available.
                </FieldDescription>
              </Field>
            )}
          </FieldGroup>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Nutrition per 100g</CardTitle>
          <CardDescription>
            Calories and macros must be non-negative whole numbers. No rounding
            or serving conversion is applied.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className='grid sm:grid-cols-2'>
            {macros.map(([name, label]) => (
              <Field
                key={name}
                data-invalid={Boolean(errors[name])}
                data-disabled={locked}
              >
                <FieldLabel htmlFor={`${id}-${name}`}>{label}</FieldLabel>
                <Input
                  id={`${id}-${name}`}
                  inputMode='numeric'
                  {...register(name)}
                  disabled={locked}
                  aria-invalid={Boolean(errors[name])}
                  aria-describedby={
                    errors[name] ? `${id}-${name}-error` : undefined
                  }
                />
                <FieldError
                  id={`${id}-${name}-error`}
                  errors={[errors[name]]}
                />
              </Field>
            ))}
          </FieldGroup>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Additional nutrients</CardTitle>
          <CardDescription>
            Amounts are per 100g in each nutrient's unit. Existing inactive
            amounts are read-only and can be explicitly removed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IngredientNutrientFields
            form={form}
            disabled={locked}
            id={id}
          />
        </CardContent>
        <CardFooter className='flex-col items-stretch gap-4'>
          {generalError && (
            <Alert variant='destructive'>
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}
          <div className='flex flex-wrap justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              disabled={locked}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={locked || unconfigured}
            >
              {locked && (
                <Spinner
                  aria-hidden='true'
                  data-icon='inline-start'
                />
              )}
              {ingredient ? 'Save changes' : 'Create ingredient'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
