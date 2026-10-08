import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { normalizeIngredientApiError } from '../api/ingredient-adapter';
import type { IngredientApiError } from '../api/ingredient-transport';
import {
  useCreateIngredientMutation,
  useGetIngredientQuery,
  useUpdateIngredientMutation,
} from '../api/ingredients-api';
import { IngredientForm } from '../components/IngredientForm';
import { useIngredientDirtyGuard } from '../hooks/use-ingredient-dirty-guard';
import { isSystemIngredient } from '../ingredient-policy';
import { getIngredientReturnTo } from '../ingredient-query';
import type { IngredientSaveInput } from '../ingredient.types';

export function IngredientFormPage(): React.JSX.Element {
  const { id: rawId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const editing = rawId !== undefined;
  const id = rawId && /^\d+$/.test(rawId) ? Number(rawId) : 0;
  const validId = Number.isSafeInteger(id) && id > 0;
  const returnTo = getIngredientReturnTo(params.get('returnTo'));
  const detail = useGetIngredientQuery(id, { skip: !editing || !validId });
  const [createIngredient, createState] = useCreateIngredientMutation();
  const [updateIngredient, updateState] = useUpdateIngredientMutation();
  const isPending = createState.isLoading || updateState.isLoading;
  const guard = useIngredientDirtyGuard(isPending);
  const ingredient = detail.currentData;
  let unavailable: string | null = null;
  if (editing && !validId)
    unavailable = 'Invalid ingredient ID. The editor is unavailable.';
  else if (editing && ingredient && !isSystemIngredient(ingredient))
    unavailable = 'Only system ingredients can be edited.';
  else if (editing && ingredient?.nutrientLinks === null)
    unavailable =
      'Ingredient nutrient metadata is unavailable. Editing is disabled.';

  async function save(input: IngredientSaveInput) {
    if (
      editing &&
      (!validId ||
        !ingredient ||
        !isSystemIngredient(ingredient) ||
        ingredient.nutrientLinks === null)
    )
      throw {
        status: 403,
        message: 'The ingredient editor is unavailable.',
      } satisfies IngredientApiError;
    guard.startPending();
    try {
      if (editing) await updateIngredient({ id, input }).unwrap();
      else await createIngredient(input).unwrap();
      guard.markSaved();
      toast.success(editing ? 'Ingredient updated.' : 'Ingredient created.');
      await navigate(returnTo);
    } finally {
      guard.finishPending();
    }
  }
  const loading = editing && validId && !ingredient && !detail.isError;
  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col gap-6'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <h1>{editing ? 'Edit ingredient' : 'Create ingredient'}</h1>
        <Button
          type='button'
          variant='outline'
          disabled={isPending}
          onClick={() => void navigate(returnTo)}
        >
          Back
        </Button>
      </div>
      {unavailable ? (
        <Alert variant='destructive'>
          <AlertTitle>Editor unavailable</AlertTitle>
          <AlertDescription>{unavailable}</AlertDescription>
        </Alert>
      ) : loading ? (
        <section aria-label='Loading ingredient'>
          <p role='status'>
            <Spinner aria-hidden='true' />
            Loading ingredient
          </p>
          <Skeleton className='mt-4 h-48 w-full' />
        </section>
      ) : editing && !ingredient ? (
        <Alert variant='destructive'>
          <AlertTitle>Unable to load ingredient</AlertTitle>
          <AlertDescription>
            {normalizeIngredientApiError(detail.error).message}
            <Button
              type='button'
              variant='outline'
              onClick={() => void detail.refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {editing && detail.isFetching && (
            <p role='status'>Refreshing ingredient</p>
          )}
          {editing && detail.isError && (
            <Alert variant='destructive'>
              <AlertDescription>
                {normalizeIngredientApiError(detail.error).message}
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => void detail.refetch()}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}
          <IngredientForm
            key={editing ? id : 'create'}
            ingredient={editing ? ingredient : undefined}
            onSubmit={save}
            onCancel={() => void navigate(returnTo)}
            isPending={isPending}
            error={null}
            onDirtyChange={guard.onDirtyChange}
          />
        </>
      )}
      {guard.confirmation}
    </div>
  );
}
