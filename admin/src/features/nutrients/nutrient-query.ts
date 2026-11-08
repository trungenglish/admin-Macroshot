import {
  NUTRIENT_PAGE_SIZES,
  NUTRIENT_UNITS,
  type NutrientListQuery,
  type NutrientUnit,
} from './nutrient.types';

function readPositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseNutrientSearchParams(
  params: URLSearchParams,
): NutrientListQuery {
  const page = readPositiveInteger(params.get('page'), 1);
  const requestedPageSize = readPositiveInteger(params.get('pageSize'), 10);
  const pageSize = NUTRIENT_PAGE_SIZES.includes(
    requestedPageSize as (typeof NUTRIENT_PAGE_SIZES)[number],
  )
    ? requestedPageSize
    : 10;
  const unitValue = params.get('unit');
  const unit = NUTRIENT_UNITS.includes(unitValue as NutrientUnit)
    ? (unitValue as NutrientUnit)
    : undefined;
  const activeValue = params.get('isActive');
  const isActive =
    activeValue === 'true' ? true : activeValue === 'false' ? false : undefined;

  return {
    page,
    pageSize,
    search: params.get('search')?.trim() ?? '',
    ...(unit ? { unit } : {}),
    ...(isActive === undefined ? {} : { isActive }),
  };
}

export function writeNutrientSearchParams(query: NutrientListQuery) {
  const params = new URLSearchParams();
  if (query.page !== 1) params.set('page', String(query.page));
  if (query.pageSize !== 10) params.set('pageSize', String(query.pageSize));
  if (query.search) params.set('search', query.search);
  if (query.unit) params.set('unit', query.unit);
  if (query.isActive !== undefined) {
    params.set('isActive', String(query.isActive));
  }
  return params;
}
