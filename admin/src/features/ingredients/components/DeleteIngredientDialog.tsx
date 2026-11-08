import type { Ingredient } from '../ingredient.types';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
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
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  useDeleteIngredientMutation,
  useGetIngredientQuery,
} from '../api/ingredients-api';
import type { IngredientApiError } from '../api/ingredient-transport';
import { getIngredientDeletePolicy } from '../ingredient-policy';

export function DeleteIngredientDialog({
  ingredient,
  onClose,
}: {
  ingredient: Ingredient | null;
  onClose(): void;
}): React.JSX.Element {
  return ingredient ? (
    <DeleteConfirmation
      key={ingredient.id}
      ingredient={ingredient}
      onClose={onClose}
    />
  ) : (
    <></>
  );
}

function DeleteConfirmation({
  ingredient,
  onClose,
}: {
  ingredient: Ingredient;
  onClose(): void;
}): React.JSX.Element {
  const {
    currentData: details,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetIngredientQuery(ingredient.id, { refetchOnMountOrArgChange: true });
  const [remove, mutation] = useDeleteIngredientMutation();
  const [checking, setChecking] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const latest = useRef(ingredient);
  const mounted = useRef(true);
  useLayoutEffect(() => {
    latest.current = ingredient;
  }, [ingredient]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const listPolicy = getIngredientDeletePolicy(ingredient);
  const detailPolicy = details ? getIngredientDeletePolicy(details) : null;
  const busy = checking || mutation.isLoading;
  const canConfirm =
    listPolicy.canDelete && detailPolicy?.canDelete && !isFetching && !isError;
  const message =
    requestError ??
    listPolicy.reason ??
    detailPolicy?.reason ??
    (isError ? (error as IngredientApiError)?.message : null);

  async function confirm() {
    if (inFlight.current || !canConfirm) return;
    inFlight.current = true;
    setChecking(true);
    setRequestError(null);
    try {
      // Cached list/detail metadata is never the final authorization for a delete.
      const refreshed = await refetch().unwrap();
      if (!mounted.current) return;
      const policy = getIngredientDeletePolicy(latest.current);
      const freshPolicy = getIngredientDeletePolicy(refreshed);
      if (!policy.canDelete || !freshPolicy.canDelete) {
        setRequestError(policy.reason ?? freshPolicy.reason);
        return;
      }
      if (refreshed.id !== ingredient.id)
        throw new Error('Ingredient details changed. Deletion is disabled.');
      if (refreshed.name !== details?.name) {
        setRequestError(
          'Ingredient details changed. Review the updated name before confirming deletion.',
        );
        return;
      }
      await remove(ingredient.id).unwrap();
      if (!mounted.current) return;
      toast.success('Ingredient deleted.');
      onClose();
    } catch (caught) {
      if (mounted.current) {
        const failure = caught as IngredientApiError;
        setRequestError(
          failure?.status === 409
            ? 'This ingredient is used by a recipe and cannot be deleted.'
            : failure?.message ||
                'Unable to delete the ingredient. Please try again.',
        );
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setChecking(false);
    }
  }

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !inFlight.current) onClose();
      }}
    >
      <AlertDialogContent
        aria-busy={busy || isFetching}
        onEscapeKeyDown={(event) => {
          if (inFlight.current) event.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {details?.name ?? ingredient.name} permanently?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Permanent deletion cannot be undone. Recipe usage and system
            ownership will be checked again before deletion.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isFetching && (
          <div
            role='status'
            className='flex items-center gap-2'
          >
            <Spinner aria-hidden='true' />
            Checking ingredient recipe usage
          </div>
        )}
        {message && (
          <Alert variant='destructive'>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {isError && (
          <Button
            variant='outline'
            disabled={busy || isFetching}
            onClick={() => {
              setRequestError(null);
              void refetch();
            }}
          >
            Retry recipe usage check
          </Button>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={busy}
            onClick={(event) => {
              if (inFlight.current) event.preventDefault();
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={busy || !canConfirm}
            onClick={(event) => {
              event.preventDefault();
              void confirm();
            }}
          >
            {busy && (
              <Spinner
                aria-hidden='true'
                data-icon='inline-start'
              />
            )}
            Delete permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
