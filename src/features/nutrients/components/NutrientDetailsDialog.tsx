import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useGetNutrientQuery, type ApiError } from '../api/nutrients-api';
import type { SelectedNutrientDialogProps } from './NutrientStatusDialog';

export function NutrientDetailsDialog({
  nutrient,
  open,
  pending = false,
  errorMessage,
  onOpenChange,
}: SelectedNutrientDialogProps) {
  const {
    currentData: details,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetNutrientQuery(nutrient?.id ?? 0, { skip: !open || !nutrient });
  if (!nutrient) return null;
  const loading = isLoading || (isFetching && !details);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Nutrient details</DialogTitle>
          <DialogDescription>
            View the nutrient measurement unit, status, and ingredient usage.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div role='status' className='flex flex-col gap-3'>
            <span className='sr-only'>Loading nutrient details</span>
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-6 w-1/2' />
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-6 w-1/2' />
          </div>
        ) : isError || errorMessage ? (
          <Alert variant='destructive'>
            <AlertTitle>Unable to load nutrient details</AlertTitle>
            <AlertDescription>
              {errorMessage ||
                (error as ApiError)?.message ||
                'Unable to complete the request. Please try again.'}
              <Button
                variant='outline'
                disabled={isFetching || pending}
                onClick={() => void refetch()}
              >
                {isFetching && <Spinner aria-hidden='true' data-icon='inline-start' />}
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : details && (
          <dl className='grid grid-cols-2 gap-3'>
            <dt>Name</dt><dd>{details.name}</dd>
            <dt>Unit</dt><dd>{details.unit}</dd>
            <dt>Status</dt>
            <dd>
              <Badge variant={details.isActive ? 'default' : 'secondary'}>
                {details.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </dd>
            <dt>Ingredient usage count</dt><dd>{details.ingredientCount}</dd>
          </dl>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline' disabled={pending}>
              {pending && <Spinner aria-hidden='true' data-icon='inline-start' />}
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
