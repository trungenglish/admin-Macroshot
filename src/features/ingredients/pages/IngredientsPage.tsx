import { useMemo, useState } from 'react';
import { PlusIcon, SearchIcon, XIcon } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { useListIngredientsQuery } from '../api/ingredients-api';
import type { IngredientApiError } from '../api/ingredient-transport';
import { DeleteIngredientDialog } from '../components/DeleteIngredientDialog';
import { createIngredientColumns } from '../components/IngredientColumns';
import { IngredientDetailsDialog } from '../components/IngredientDetailsDialog';
import { IngredientSummaryCards } from '../components/IngredientSummaryCards';
import { IngredientTable } from '../components/IngredientTable';
import { IngredientTableSkeleton } from '../components/IngredientTableSkeleton';
import {
  getIngredientDeletePolicy,
  isSystemIngredient,
} from '../ingredient-policy';
import {
  parseIngredientSearchParams,
  writeIngredientSearchParams,
} from '../ingredient-query';
import type { Ingredient, IngredientListQuery } from '../ingredient.types';

export function IngredientsPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = parseIngredientSearchParams(searchParams);
  const {
    currentData: result,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useListIngredientsQuery(query);
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [selectedDelete, setSelectedDelete] = useState<Ingredient | null>(null);
  const [searchDraft, setSearchDraft] = useState<{
    queryValue: string;
    value: string;
  } | null>(null);
  const [unitDraft, setUnitDraft] = useState<{
    queryValue: string;
    value: string;
  } | null>(null);
  // Preserve spaces while typing, but an external URL change still owns the controls.
  const searchValue =
    searchDraft?.queryValue === query.search ? searchDraft.value : query.search;
  const unitValue =
    unitDraft?.queryValue === (query.unit ?? '')
      ? unitDraft.value
      : (query.unit ?? '');
  // Only canonical feature query fields are carried to a separate editor.
  const canonicalSearch = writeIngredientSearchParams(query).toString();
  const returnTo = `/admin/ingredients${canonicalSearch ? `?${canonicalSearch}` : ''}`;
  const editorSearch = `?${new URLSearchParams({ returnTo })}`;
  const columns = useMemo(
    () =>
      createIngredientColumns({
        onView: (ingredient) => {
          if (isSystemIngredient(ingredient)) setDetailsId(ingredient.id);
        },
        onEdit: (ingredient) => {
          if (isSystemIngredient(ingredient))
            void navigate(
              `/admin/ingredients/${ingredient.id}/edit${editorSearch}`,
            );
        },
        onDelete: (ingredient) => {
          if (getIngredientDeletePolicy(ingredient).canDelete)
            setSelectedDelete(ingredient);
        },
      }),
    [navigate, editorSearch],
  );
  const currentDelete = selectedDelete
    ? result?.items.find((item) => item.id === selectedDelete.id)
    : null;
  // A missing row, changed URL, fetch or failed list refresh is not evidence of zero usage.
  const deleteIngredient = selectedDelete
    ? !isError && !isFetching && currentDelete
      ? currentDelete
      : { ...selectedDelete, recipeCount: null }
    : null;
  const hasFilters = Boolean(query.search || query.unit);
  const loading = isLoading || (isFetching && !result);
  function changeQuery(changes: Partial<IngredientListQuery>) {
    setSearchParams(writeIngredientSearchParams({ ...query, ...changes }));
  }
  function clearFilters() {
    changeQuery({ page: 1, search: '', unit: undefined });
  }
  const addLink = (
    <Button
      asChild
      className='dark:text-background'
    >
      <Link to={`/admin/ingredients/new${editorSearch}`}>
        <PlusIcon
          aria-hidden='true'
          data-icon='inline-start'
        />
        Add ingredient
      </Link>
    </Button>
  );
  return (
    <div className='flex min-w-0 flex-col gap-5'>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className='inline-flex min-h-8 items-center'
            >
              <Link to='/admin'>Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Ingredients</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className='flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between'>
        <div className='flex min-w-0 flex-col gap-1.5'>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-semibold tracking-tight text-balance'>
              Ingredients
            </h1>
            {result && (
              <Badge variant='secondary'>{result.total} ingredients</Badge>
            )}
          </div>
          <p className='max-w-2xl text-sm text-muted-foreground'>
            Manage system ingredients and their nutrition per 100g. Personal
            ingredients are not managed here.
          </p>
        </div>
        {addLink}
      </div>
      <IngredientSummaryCards
        summary={result?.summary}
        loading={loading}
      />
      <Card className='min-w-0 gap-0 overflow-hidden py-0 shadow-none'>
        <CardHeader className='border-b px-4 py-4 sm:px-5'>
          <CardTitle>Ingredient catalog</CardTitle>
          <CardDescription>
            Search, review nutrition values, and manage every system ingredient.
          </CardDescription>
          {result && (
            <CardAction>
              <Badge variant='outline'>{result.total} matching</Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className='flex min-w-0 flex-col gap-4 px-4 py-4 sm:px-5'>
          <FieldGroup className='grid gap-3 md:grid-cols-[minmax(0,1fr)_11rem]'>
            <Field>
              <FieldLabel htmlFor='ingredient-search'>
                Search ingredients
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id='ingredient-search'
                  name='ingredient-search'
                  type='search'
                  autoComplete='off'
                  placeholder='Search by ingredient name…'
                  value={searchValue}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSearchDraft({ queryValue: value.trim(), value });
                    changeQuery({ search: value.trim(), page: 1 });
                  }}
                />
                <InputGroupAddon>
                  <SearchIcon aria-hidden='true' />
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor='ingredient-unit-filter'>
                Unit filter
              </FieldLabel>
              <Input
                id='ingredient-unit-filter'
                name='ingredient-unit-filter'
                autoComplete='off'
                placeholder='All units'
                maxLength={10}
                value={unitValue}
                onChange={(event) => {
                  const value = event.target.value;
                  setUnitDraft({ queryValue: value.trim(), value });
                  changeQuery({ unit: value.trim() || undefined, page: 1 });
                }}
              />
            </Field>
          </FieldGroup>
          {hasFilters && (
            <section
              aria-label='Active ingredient filters'
              className='flex flex-wrap items-center gap-2 border-t pt-3'
            >
              <span className='mr-1 text-sm font-medium'>Active filters</span>
              {query.search && (
                <Badge variant='secondary'>Search: {query.search}</Badge>
              )}
              {query.unit && (
                <Badge variant='secondary'>Unit: {query.unit}</Badge>
              )}
              <Button
                variant='ghost'
                size='sm'
                className='ml-auto'
                onClick={clearFilters}
              >
                <XIcon
                  aria-hidden='true'
                  data-icon='inline-start'
                />
                Clear filters
              </Button>
            </section>
          )}
          <section
            aria-label='Ingredient results'
            aria-busy={isFetching}
            className='flex min-w-0 flex-col gap-4'
          >
            {isError && (
              <Alert variant='destructive'>
                <AlertTitle>Unable to load ingredients</AlertTitle>
                <AlertDescription>
                  {(error as IngredientApiError)?.message ??
                    'Unable to complete the request. Please try again.'}
                  <Button
                    variant='outline'
                    disabled={isFetching}
                    onClick={() => void refetch()}
                  >
                    {isFetching && (
                      <Spinner
                        aria-hidden='true'
                        data-icon='inline-start'
                      />
                    )}
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {loading ? (
              <IngredientTableSkeleton />
            ) : (
              result && (
                <>
                  {isFetching && (
                    <div
                      role='status'
                      className='flex items-center gap-2 text-muted-foreground'
                    >
                      <Spinner aria-hidden='true' />
                      Refreshing ingredients
                    </div>
                  )}
                  {result.items.length > 0 || result.total > 0 ? (
                    <IngredientTable
                      data={result.items.filter(isSystemIngredient)}
                      total={result.total}
                      page={query.page}
                      pageSize={query.pageSize}
                      columns={columns}
                      onPageChange={(page) => changeQuery({ page })}
                      onPageSizeChange={(pageSize) =>
                        changeQuery({ pageSize, page: 1 })
                      }
                    />
                  ) : (
                    !isError && (
                      <Empty>
                        <EmptyHeader>
                          <EmptyTitle>
                            {hasFilters
                              ? 'No matching ingredients'
                              : 'No ingredients yet'}
                          </EmptyTitle>
                          <EmptyDescription>
                            {hasFilters
                              ? 'Try another search or clear the filters above.'
                              : 'Add your first system ingredient to get started.'}
                          </EmptyDescription>
                        </EmptyHeader>
                        {!hasFilters && <EmptyContent>{addLink}</EmptyContent>}
                      </Empty>
                    )
                  )}
                </>
              )
            )}
          </section>
        </CardContent>
        <CardFooter className='border-t px-4 py-3 text-xs text-muted-foreground sm:px-5'>
          {result?.summary
            ? 'Overview values reflect the complete catalog; filters affect the table results only.'
            : 'Filters affect the table results and stay synchronized with the URL.'}
        </CardFooter>
      </Card>
      <IngredientDetailsDialog
        id={detailsId}
        onClose={() => setDetailsId(null)}
      />
      <DeleteIngredientDialog
        ingredient={deleteIngredient}
        onClose={() => setSelectedDelete(null)}
      />
    </div>
  );
}
