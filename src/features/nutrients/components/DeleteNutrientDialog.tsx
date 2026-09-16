import { useRef, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';
import { getNutrientActionPolicy } from '../nutrient-policy';
import type { Nutrient } from '../nutrient.types';
import type { SelectedNutrientDialogProps } from './NutrientStatusDialog';

export function DeleteNutrientDialog(props: SelectedNutrientDialogProps) {
  if (
    !props.open ||
    !props.nutrient ||
    !getNutrientActionPolicy(props.nutrient).canDelete
  ) return null;
  return (
    <DeleteConfirmation
      key={props.nutrient.id}
      {...props}
      nutrient={props.nutrient}
    />
  );
}

function DeleteConfirmation({
  nutrient,
  open,
  pending = false,
  errorMessage,
  onOpenChange,
  onConfirm,
}: SelectedNutrientDialogProps & { nutrient: Nutrient }) {
  const submitting = useRef(false);
  const [localPending, setLocalPending] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const busy = pending || localPending;

  async function confirm() {
    if (
      !open ||
      pending ||
      submitting.current ||
      !onConfirm ||
      !getNutrientActionPolicy(nutrient).canDelete
    ) return;
    submitting.current = true;
    setLocalPending(true);
    setRequestError(null);
    try {
      await onConfirm(nutrient);
      onOpenChange(false);
    } catch (error) {
      setRequestError(
        (error as { message?: string })?.message ??
          'Unable to complete the request. Please try again.',
      );
    } finally {
      submitting.current = false;
      setLocalPending(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!busy && !submitting.current) onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent
        aria-busy={busy}
        onEscapeKeyDown={(event) => {
          if (busy || submitting.current) event.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {nutrient.name} permanently?</AlertDialogTitle>
          <AlertDialogDescription>
            This nutrient is not used by any ingredients. Permanent deletion cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {(errorMessage || requestError) && (
          <Alert variant='destructive'>
            <AlertDescription>{errorMessage || requestError}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={busy || !onConfirm}
            onClick={(event) => {
              event.preventDefault();
              void confirm();
            }}
          >
            {busy && <Spinner aria-hidden='true' data-icon='inline-start' />}
            Delete permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
