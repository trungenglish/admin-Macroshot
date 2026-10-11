import { useEffect, useState } from 'react';
import { MenuIcon, SearchIcon, UtensilsIcon } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useSidebar } from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useListRecipesQuery, type RecipesApiError } from '../api/recipes-api';
import { RecipeDetailsDialog } from '../components/RecipeDetailsDialog';
import { RecipeTableSkeleton } from '../components/RecipeTableSkeleton';
import type { Recipe, RecipeListQuery } from '../recipe.types';

const PAGE_SIZE = 10;
const formatNumber = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
});

function readQuery(params: URLSearchParams): RecipeListQuery {
  const rawPage = Number(params.get('page'));
  return {
    page: Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    pageSize: PAGE_SIZE,
    search: params.get('search')?.trim() ?? '',
  };
}

function writeQuery(query: RecipeListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.page > 1) params.set('page', String(query.page));
  if (query.search) params.set('search', query.search);
  return params;
}

function RecipeIdentity({ recipe }: { recipe: Recipe }): React.JSX.Element {
  return (
    <div className='flex min-w-[220px] items-center gap-3'>
      {recipe.imageUrl ? (
        <img
          src={recipe.imageUrl}
          alt=''
          loading='lazy'
          className='size-12 shrink-0 rounded-md border bg-muted/20 object-cover'
        />
      ) : (
        <div className='flex size-12 shrink-0 items-center justify-center rounded-md border bg-muted/30 text-muted-foreground'>
          <UtensilsIcon
            aria-hidden='true'
            className='size-5'
          />
        </div>
      )}
      <div className='min-w-0'>
        <p
          className='max-w-[250px] truncate text-[13px] font-medium'
          title={recipe.name}
        >
          {recipe.name}
        </p>
        <div className='mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground'>
          <span>
            {recipe.brandName || 'No brand'} ·{' '}
            {formatNumber.format(recipe.gramWeight)} g ·
          </span>
          <RecipeStatusBadges
            recipe={recipe}
            compact
          />
        </div>
      </div>
    </div>
  );
}

function RecipeStatusBadges({
  recipe,
  compact = false,
}: {
  recipe: Recipe;
  compact?: boolean;
}): React.JSX.Element {
  const badgeClass = compact ? 'h-5 px-1.5 py-0 text-xs' : '';
  return (
    <>
      <Badge
        variant={recipe.isSystem ? 'secondary' : 'outline'}
        className={badgeClass}
      >
        {recipe.isSystem ? 'System' : 'User'}
      </Badge>
      <Badge
        variant='outline'
        className={`${badgeClass} ${recipe.isVerified ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}
      >
        {recipe.isVerified ? 'Verified' : 'Pending'}
      </Badge>
    </>
  );
}

function PageNumbers({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange(page: number): void;
}): React.JSX.Element {
  const pages = Array.from(new Set([1, page - 1, page, page + 1, pageCount]))
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b);
  return (
    <Pagination className='mx-0 w-auto justify-end'>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href='#'
            onClick={(event) => {
              event.preventDefault();
              if (page > 1) onChange(page - 1);
            }}
            aria-disabled={page <= 1}
            className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
        {pages.map((value, index) => (
          <span
            key={value}
            className='contents'
          >
            {index > 0 && value - pages[index - 1]! > 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink
                href='#'
                isActive={value === page}
                aria-label={`Go to page ${value}`}
                onClick={(event) => {
                  event.preventDefault();
                  onChange(value);
                }}
              >
                {value}
              </PaginationLink>
            </PaginationItem>
          </span>
        ))}
        <PaginationItem>
          <PaginationNext
            href='#'
            onClick={(event) => {
              event.preventDefault();
              if (page < pageCount) onChange(page + 1);
            }}
            aria-disabled={page >= pageCount}
            className={
              page >= pageCount ? 'pointer-events-none opacity-50' : ''
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export function RecipesPage(): React.JSX.Element {
  const { toggleSidebar } = useSidebar();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = readQuery(searchParams);
  const [searchDraft, setSearchDraft] = useState(query.search);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const {
    data: result,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useListRecipesQuery(query);

  useEffect(() => setSearchDraft(query.search), [query.search]);

  function changeQuery(changes: Partial<RecipeListQuery>) {
    setSearchParams(writeQuery({ ...query, ...changes }));
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalizedSearch = searchDraft.trim();
      if (normalizedSearch !== query.search) {
        changeQuery({ search: normalizedSearch, page: 1 });
      }
    }, 250);
    return () => window.clearTimeout(timer);
    // Search changes should debounce against the URL's current query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft, query.search]);

  const pageCount = Math.max(1, Math.ceil((result?.total ?? 0) / PAGE_SIZE));
  const start =
    result && result.total > 0 ? (query.page - 1) * PAGE_SIZE + 1 : 0;
  const end =
    result && result.items.length > 0 ? start + result.items.length - 1 : 0;
  const loading = isLoading && !result;
  const recipes = result?.items ?? [];

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
            <BreadcrumbPage>Recipes</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className='flex flex-col gap-1.5 border-b pb-5'>
        <div className='flex flex-wrap items-center gap-3'>
          <h1 className='text-[21px] font-semibold tracking-tight sm:text-2xl'>
            Recipes
          </h1>
        </div>
        <p className='text-sm text-muted-foreground'>
          Review recipes and their nutrition details.
        </p>
      </header>

      <div className='-mt-2 md:hidden'>
        <Button
          variant='outline'
          onClick={toggleSidebar}
        >
          <MenuIcon aria-hidden='true' />
          Menu
        </Button>
      </div>

      <section
        aria-label='Recipe catalog'
        className='flex min-w-0 flex-col gap-4'
      >
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='relative w-full sm:max-w-sm'>
            <SearchIcon
              aria-hidden='true'
              className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
            />
            <Input
              aria-label='Search recipes by name'
              type='search'
              autoComplete='off'
              placeholder='Search recipes by name…'
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              className='pl-9 text-[13px] md:text-[13px]'
            />
          </div>
          {result && (
            <p className='text-sm text-muted-foreground'>
              {result.total} {result.total === 1 ? 'recipe' : 'recipes'}
            </p>
          )}
        </div>

        {isError && !result ? (
          <div className='flex min-h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-5 text-center'>
            <h2 className='font-medium'>Unable to load recipes</h2>
            <p className='max-w-md text-sm text-muted-foreground'>
              {(error as RecipesApiError)?.message ??
                'Unable to complete the request. Please try again.'}
            </p>
            <Button
              variant='outline'
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              Retry
            </Button>
          </div>
        ) : loading ? (
          <RecipeTableSkeleton />
        ) : result && recipes.length > 0 ? (
          <div className='overflow-hidden rounded-lg border'>
            {isFetching && (
              <div
                className='h-0.5 w-full overflow-hidden bg-muted'
                aria-hidden='true'
              >
                <div className='h-full w-1/3 animate-[progress-slide_1.2s_ease-in-out_infinite] bg-primary motion-reduce:animate-pulse' />
              </div>
            )}
            <div className='hidden overflow-x-auto xl:block'>
              <Table className='min-w-[900px]'>
                <TableHeader className='bg-muted/40'>
                  <TableRow>
                    {[
                      'Recipe',
                      'Calories / 100 g',
                      'Protein',
                      'Carbs',
                      'Fat',
                      'Status',
                      '',
                    ].map((heading, index) => (
                      <TableHead
                        key={heading || `action-${index}`}
                        scope='col'
                        className='h-12 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground'
                      >
                        {heading}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipes.map((recipe) => (
                    <TableRow
                      key={recipe.id}
                      className='h-[76px] hover:bg-transparent'
                    >
                      <TableCell className='px-4'>
                        <RecipeIdentity recipe={recipe} />
                      </TableCell>
                      <TableCell className='px-4 tabular-nums'>
                        {formatNumber.format(recipe.calPer100g)} kcal
                      </TableCell>
                      <TableCell className='px-4 tabular-nums'>
                        {formatNumber.format(recipe.proPer100g)} g
                      </TableCell>
                      <TableCell className='px-4 tabular-nums'>
                        {formatNumber.format(recipe.carbPer100g)} g
                      </TableCell>
                      <TableCell className='px-4 tabular-nums'>
                        {formatNumber.format(recipe.fatPer100g)} g
                      </TableCell>
                      <TableCell className='px-4'>
                        <div className='flex flex-wrap gap-1.5'>
                          <RecipeStatusBadges recipe={recipe} />
                        </div>
                      </TableCell>
                      <TableCell className='px-4'>
                        <Button
                          variant='outline'
                          size='sm'
                          className='text-[13px]'
                          onClick={() => setSelectedRecipe(recipe)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className='divide-y xl:hidden'>
              {recipes.map((recipe) => (
                <li
                  key={recipe.id}
                  className='flex flex-col gap-2 p-3'
                >
                  <div className='flex items-center justify-between gap-3'>
                    <RecipeIdentity recipe={recipe} />
                    <Button
                      variant='outline'
                      size='sm'
                      className='text-[13px]'
                      onClick={() => setSelectedRecipe(recipe)}
                    >
                      Details
                    </Button>
                  </div>
                  <div className='border-t pt-2 pl-[60px] text-xs'>
                    <span className='font-medium tabular-nums'>
                      {formatNumber.format(recipe.calPer100g)} kcal
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            {isError && (
              <Alert
                variant='destructive'
                className='m-3'
              >
                <AlertTitle>Unable to refresh recipes</AlertTitle>
                <AlertDescription>
                  {(error as RecipesApiError)?.message ??
                    'Unable to complete the request. Please try again.'}
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => void refetch()}
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            <footer className='flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
              <p className='text-xs text-muted-foreground'>
                Showing {start}–{end} of {result.total} recipes
              </p>
              <div className='flex items-center justify-between gap-4 sm:contents'>
                {pageCount > 1 && (
                  <PageNumbers
                    page={query.page}
                    pageCount={pageCount}
                    onChange={(page) => changeQuery({ page })}
                  />
                )}
                <span className='shrink-0 text-xs text-muted-foreground'>
                  10 / page
                </span>
              </div>
            </footer>
          </div>
        ) : result ? (
          <div className='flex min-h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-5 text-center'>
            <h2 className='font-medium'>
              {query.search ? 'No recipes found' : 'No recipes yet'}
            </h2>
            <p className='max-w-md text-sm text-muted-foreground'>
              {query.search
                ? `No recipes match “${query.search}”. Try another search.`
                : 'Recipes will appear here when they are available.'}
            </p>
            {query.search && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  setSearchDraft('');
                  changeQuery({ search: '', page: 1 });
                }}
              >
                Clear search
              </Button>
            )}
          </div>
        ) : null}
      </section>
      <RecipeDetailsDialog
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
      />
    </div>
  );
}
