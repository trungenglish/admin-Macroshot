import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useGetIngredientQuery } from '../api/ingredients-api';
import type { IngredientApiError } from '../api/ingredient-transport';
import { isSystemIngredient } from '../ingredient-policy';

export function IngredientDetailsDialog({
  id,
  onClose,
}: {
  id: number | null;
  onClose(): void;
}): React.JSX.Element {
  const {
    currentData: details,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetIngredientQuery(id ?? 0, {
    skip: id === null,
    refetchOnMountOrArgChange: true,
  });
  return (
    <Dialog
      open={id !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className='max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Ingredient details</DialogTitle>
          <DialogDescription>
            Read-only system ingredient information. Nutrition is shown per
            100g.
          </DialogDescription>
        </DialogHeader>
        {isLoading || (isFetching && !details) ? (
          <div
            role='status'
            className='flex flex-col gap-3'
          >
            <span className='sr-only'>Loading ingredient details</span>
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-6 w-1/2' />
          </div>
        ) : isError ? (
          <Alert variant='destructive'>
            <AlertTitle>Unable to load ingredient details</AlertTitle>
            <AlertDescription>
              {(error as IngredientApiError)?.message ??
                'Unable to complete the request. Please try again.'}
              <Button
                variant='outline'
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : details && !isSystemIngredient(details) ? (
          <Alert variant='destructive'>
            <AlertDescription>
              Only system ingredients can be viewed.
            </AlertDescription>
          </Alert>
        ) : details ? (
          <div className='flex flex-col gap-5'>
            {isFetching && (
              <div
                role='status'
                className='flex items-center gap-2'
              >
                <Spinner aria-hidden='true' />
                Refreshing ingredient details
              </div>
            )}
            {details.imageUrl ? (
              <img
                src={details.imageUrl}
                alt={details.name}
                className='max-h-48 w-full rounded-lg border bg-muted/20 object-contain p-2'
              />
            ) : (
              <p className='rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground'>
                No image available.
              </p>
            )}
            <dl className='grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-x-4 gap-y-0 overflow-hidden rounded-lg border text-sm [&>dd]:border-b [&>dd]:py-2.5 [&>dd]:font-medium [&>dt]:border-b [&>dt]:bg-muted/35 [&>dt]:px-3 [&>dt]:py-2.5 [&>dt]:text-muted-foreground [&>*:nth-last-child(-n+2)]:border-b-0'>
              <dt>ID</dt>
              <dd>{details.id}</dd>
              <dt>Name</dt>
              <dd className='break-words'>{details.name}</dd>
              <dt>Unit</dt>
              <dd>{details.unit}</dd>
              <dt>Default serving weight</dt>
              <dd>{details.defaultWeightPerServing} g</dd>
              <dt>Last input type</dt>
              <dd>{details.lastInputType || 'Unknown'}</dd>
              <dt>Calories</dt>
              <dd>{details.calPer100g} kcal / 100g</dd>
              <dt>Protein</dt>
              <dd>{details.proPer100g} g / 100g</dd>
              <dt>Carbohydrate</dt>
              <dd>{details.carbPer100g} g / 100g</dd>
              <dt>Fat</dt>
              <dd>{details.fatPer100g} g / 100g</dd>
              <dt>Recipe usage count</dt>
              <dd>{details.recipeCount ?? 'Unknown'}</dd>
            </dl>
            <section
              aria-label='Nutrients per 100g'
              className='flex flex-col gap-3 border-t pt-4'
            >
              <h2 className='text-sm font-semibold'>Nutrients per 100g</h2>
              {details.nutrientLinks === null ? (
                <Alert>
                  <AlertDescription>
                    Nutrient metadata is unavailable.
                  </AlertDescription>
                </Alert>
              ) : details.nutrientLinks.length === 0 ? (
                <p>No nutrient links.</p>
              ) : (
                <dl className='grid grid-cols-2 gap-3'>
                  {details.nutrientLinks.map(({ nutrient, amount }) => (
                    <div
                      key={nutrient.id}
                      className='contents'
                    >
                      <dt>
                        {nutrient.name}{' '}
                        {!nutrient.isActive && (
                          <Badge variant='secondary'>Inactive</Badge>
                        )}
                      </dt>
                      <dd>
                        {amount} {nutrient.unit} / 100g
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          </div>
        ) : null}
        <DialogFooter>
          <Button
            variant='outline'
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
