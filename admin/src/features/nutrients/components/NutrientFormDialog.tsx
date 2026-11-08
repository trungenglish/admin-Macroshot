import { useEffect, useId } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { ApiError } from '../api/nutrients-api';
import { nutrientFormSchema } from '../nutrient.schema';
import {
  NUTRIENT_UNITS,
  type Nutrient,
  type NutrientFormValues,
} from '../nutrient.types';

interface NutrientFormDialogProps {
  mode: 'create' | 'edit';
  nutrient: Nutrient | null;
  open: boolean;
  onOpenChange(open: boolean): void;
  onSubmit(values: NutrientFormValues): Promise<void>;
}

export function NutrientFormDialog({
  mode,
  nutrient,
  open,
  onOpenChange,
  onSubmit,
}: NutrientFormDialogProps) {
  const id = useId();
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NutrientFormValues>({
    resolver: zodResolver(nutrientFormSchema),
    defaultValues: { name: '', unit: 'g' },
  });

  useEffect(() => {
    reset({
      name: mode === 'edit' ? (nutrient?.name ?? '') : '',
      unit: mode === 'edit' ? (nutrient?.unit ?? 'g') : 'g',
    });
  }, [open, mode, nutrient, reset]);

  async function submit(values: NutrientFormValues) {
    try {
      await onSubmit(values);
      onOpenChange(false);
      reset();
    } catch (caught) {
      const error = caught as ApiError;
      if (error?.fieldErrors?.name || error?.fieldErrors?.unit) {
        if (error.fieldErrors.name) {
          setError('name', { type: 'server', message: error.fieldErrors.name });
        }
        if (error.fieldErrors.unit) {
          setError('unit', { type: 'server', message: error.fieldErrors.unit });
        }
      } else {
        setError('root.server', {
          type: 'server',
          message:
            error?.message ??
            'Unable to complete the request. Please try again.',
        });
      }
    }
  }

  const submitLabel = mode === 'create' ? 'Create nutrient' : 'Save changes';
  const requestError = errors.root?.server?.message;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => {
          if (isSubmitting) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isSubmitting) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create nutrient' : 'Edit nutrient'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a nutrient and choose its measurement unit.'
              : 'Update the nutrient name and measurement unit.'}
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          aria-busy={isSubmitting}
          onSubmit={handleSubmit(submit)}
        >
          <FieldGroup className='gap-5'>
            <Field
              data-invalid={Boolean(errors.name)}
              data-disabled={isSubmitting}
            >
              <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
              <Input
                {...register('name')}
                id={`${id}-name`}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? `${id}-name-error` : undefined}
              />
              <FieldError
                id={`${id}-name-error`}
                errors={[errors.name]}
              />
            </Field>
            <Controller
              control={control}
              name='unit'
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  data-disabled={isSubmitting}
                >
                  <FieldLabel htmlFor={`${id}-unit`}>Unit</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      ref={field.ref}
                      id={`${id}-unit`}
                      onBlur={field.onBlur}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={
                        fieldState.invalid ? `${id}-unit-error` : undefined
                      }
                    >
                      <SelectValue placeholder='Choose a unit' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {NUTRIENT_UNITS.map((unit) => (
                          <SelectItem
                            key={unit}
                            value={unit}
                          >
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError
                    id={`${id}-unit-error`}
                    errors={[fieldState.error]}
                  />
                </Field>
              )}
            />
            {requestError && (
              <Alert variant='destructive'>
                <AlertDescription>{requestError}</AlertDescription>
              </Alert>
            )}
            <DialogFooter className='border-t pt-4'>
              <DialogClose asChild>
                <Button
                  type='button'
                  variant='outline'
                  disabled={isSubmitting}
                >
                  Close
                </Button>
              </DialogClose>
              <Button
                type='submit'
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Spinner
                    aria-hidden='true'
                    data-icon='inline-start'
                  />
                )}
                {submitLabel}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
