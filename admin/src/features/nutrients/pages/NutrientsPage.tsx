import { useMemo, useState } from 'react';
import { PlusIcon, SearchIcon, XIcon } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
  useCreateNutrientMutation,
  useDeleteNutrientMutation,
  useGetNutrientsQuery,
  useUpdateNutrientMutation,
  type ApiError,
} from '../api/nutrients-api';
import { DeleteNutrientDialog } from '../components/DeleteNutrientDialog';
import { createNutrientColumns } from '../components/NutrientColumns';
import { NutrientDetailsDialog } from '../components/NutrientDetailsDialog';
import { NutrientFormDialog } from '../components/NutrientFormDialog';
import { NutrientSummaryCards } from '../components/NutrientSummaryCards';
import { NutrientTable } from '../components/NutrientTable';
import { NutrientTableSkeleton } from '../components/NutrientTableSkeleton';
import { getNutrientActionPolicy } from '../nutrient-policy';
import {
  parseNutrientSearchParams,
  writeNutrientSearchParams,
} from '../nutrient-query';
import {
  NUTRIENT_UNITS,
  type Nutrient,
  type NutrientFormValues,
  type NutrientListQuery,
  type NutrientUnit,
} from '../nutrient.types';

type DialogSelection = {
  type: 'create' | 'edit' | 'details' | 'delete' | null;
  nutrient: Nutrient | null;
};

export function NutrientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseNutrientSearchParams(searchParams);
  const {
    currentData: result,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetNutrientsQuery(query);
  const [createNutrient] = useCreateNutrientMutation();
  const [updateNutrient] = useUpdateNutrientMutation();
  const [deleteNutrient, deleteState] = useDeleteNutrientMutation();
  const [selection, setSelection] = useState<DialogSelection>({
    type: null,
    nutrient: null,
  });
  const currentNutrient =
    result?.items.find((nutrient) => nutrient.id === selection.nutrient?.id) ??
    selection.nutrient;
  const hasFilters = Boolean(query.search || query.unit);
  const loading = isLoading || (isFetching && !result);

  const columns = useMemo(
    () =>
      createNutrientColumns({
        onView: (nutrient) => setSelection({ type: 'details', nutrient }),
        onEdit: (nutrient) => setSelection({ type: 'edit', nutrient }),
        onDelete: (nutrient) => {
          if (getNutrientActionPolicy(nutrient).canDelete)
            setSelection({ type: 'delete', nutrient });
        },
      }),
    [],
  );

  function changeQuery(changes: Partial<NutrientListQuery>) {
    setSearchParams(writeNutrientSearchParams({ ...query, ...changes }));
  }

  function clearFilters() {
    changeQuery({
      page: 1,
      search: '',
      unit: undefined,
    });
  }

  function onOpenChange(open: boolean) {
    if (!open) setSelection({ type: null, nutrient: null });
  }

  async function submitForm(values: NutrientFormValues) {
    if (selection.type === 'create') {
      await createNutrient(values).unwrap();
      toast.success('Nutrient created.');
    } else if (selection.type === 'edit' && selection.nutrient) {
      await updateNutrient({ id: selection.nutrient.id, ...values }).unwrap();
      toast.success('Nutrient updated.');
    }
  }

  async function confirmDelete(nutrient: Nutrient) {
    if (!getNutrientActionPolicy(currentNutrient ?? nutrient).canDelete) {
      throw new Error(
        'This nutrient is now used by an ingredient. Deactivate it instead.',
      );
    }
    try {
      await deleteNutrient(nutrient.id).unwrap();
      toast.success('Nutrient deleted.');
    } catch (caught) {
      if ((caught as ApiError)?.status === 409) {
        throw new Error(
          'This nutrient is now used by an ingredient. Deactivate it instead.',
        );
      }
      throw caught;
    }
  }

  const addNutrient = () => setSelection({ type: 'create', nutrient: null });

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
            <BreadcrumbPage>Nutrients</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className='flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between'>
        <div className='flex min-w-0 flex-col gap-1.5'>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-semibold tracking-tight text-balance'>
              Nutrients
            </h1>
            {result && (
              <Badge variant='secondary'>{result.total} nutrients</Badge>
            )}
          </div>
          <p className='max-w-2xl text-sm text-muted-foreground'>
            Manage nutrient names, measurement units, and availability for
            ingredient associations.
          </p>
        </div>
        <Button
          onClick={addNutrient}
          className='dark:text-background'
        >
          <PlusIcon
            aria-hidden='true'
            data-icon='inline-start'
          />
          Add nutrient
        </Button>
      </div>
      <NutrientSummaryCards
        summary={result?.summary}
        loading={loading}
      />
      <Card className='min-w-0 gap-0 overflow-hidden py-0 shadow-none'>
        <CardHeader className='border-b px-4 py-4 sm:px-5'>
          <CardTitle>Nutrient catalog</CardTitle>
          <CardDescription>
            Search, filter, and manage every nutrient from one place.
          </CardDescription>
          {result && (
            <CardAction>
              <Badge variant='outline'>{result.total} matching</Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className='flex min-w-0 flex-col gap-4 px-4 py-4 sm:px-5'>
          <FieldGroup className='grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem]'>
            <Field>
              <FieldLabel htmlFor='nutrient-search'>Search</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id='nutrient-search'
                  name='nutrient-search'
                  type='search'
                  autoComplete='off'
                  placeholder='Search by nutrient name…'
                  value={searchParams.get('search') ?? ''}
                  onChange={(event) =>
                    changeQuery({ search: event.target.value, page: 1 })
                  }
                />
                <InputGroupAddon>
                  <SearchIcon aria-hidden='true' />
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor='nutrient-unit-filter'>Unit</FieldLabel>
              <Select
                value={query.unit ?? 'all'}
                onValueChange={(value) =>
                  changeQuery({
                    unit: value === 'all' ? undefined : (value as NutrientUnit),
                    page: 1,
                  })
                }
              >
                <SelectTrigger
                  id='nutrient-unit-filter'
                  className='w-full'
                  aria-label='Unit filter'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value='all'>All units</SelectItem>
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
            </Field>
          </FieldGroup>
          {hasFilters && (
            <section
              aria-label='Active nutrient filters'
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
            aria-label='Nutrient results'
            aria-busy={isFetching}
            className='flex min-w-0 flex-col gap-4'
          >
            {isError && (
              <Alert variant='destructive'>
                <AlertTitle>Unable to load nutrients</AlertTitle>
                <AlertDescription>
                  {(error as ApiError)?.message ??
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
              <NutrientTableSkeleton />
            ) : (
              result && (
                <>
                  {isFetching && (
                    <div
                      role='status'
                      className='flex items-center gap-2 text-muted-foreground'
                    >
                      <Spinner aria-hidden='true' />
                      Refreshing nutrients
                    </div>
                  )}
                  {result.items.length > 0 || result.total > 0 ? (
                    <NutrientTable
                      data={result.items}
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
                              ? 'No matching nutrients'
                              : 'No nutrients yet'}
                          </EmptyTitle>
                          <EmptyDescription>
                            {hasFilters
                              ? 'Try another search or clear the filters above.'
                              : 'Add your first nutrient to get started.'}
                          </EmptyDescription>
                        </EmptyHeader>
                        {!hasFilters && (
                          <EmptyContent>
                            <Button onClick={addNutrient}>Add nutrient</Button>
                          </EmptyContent>
                        )}
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
      <NutrientFormDialog
        mode={selection.type === 'edit' ? 'edit' : 'create'}
        nutrient={selection.nutrient}
        open={selection.type === 'create' || selection.type === 'edit'}
        onOpenChange={onOpenChange}
        onSubmit={submitForm}
      />
      <NutrientDetailsDialog
        nutrient={selection.nutrient}
        open={selection.type === 'details'}
        onOpenChange={onOpenChange}
      />
      <DeleteNutrientDialog
        nutrient={selection.nutrient}
        open={selection.type === 'delete'}
        pending={deleteState.isLoading}
        onOpenChange={onOpenChange}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
