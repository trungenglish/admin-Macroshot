import type { IngredientListQuery } from './ingredient.types';

const PAGE_SIZES = [10, 25, 50];
const LIST_PATH = '/admin/ingredients';

function isPositiveInteger(value: string | null): boolean {
  return (
    value !== null &&
    /^\d+$/.test(value) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) > 0
  );
}

function readSingle(params: URLSearchParams, key: string): string | null {
  return params.getAll(key).length === 1 ? params.get(key) : null;
}

export function parseIngredientSearchParams(
  params: URLSearchParams,
): IngredientListQuery {
  const pageValue = readSingle(params, 'page');
  const pageSizeValue = readSingle(params, 'pageSize');
  const pageSize =
    isPositiveInteger(pageSizeValue) &&
    PAGE_SIZES.includes(Number(pageSizeValue))
      ? Number(pageSizeValue)
      : 10;
  const unit = readSingle(params, 'unit')?.trim();
  return {
    page: isPositiveInteger(pageValue) ? Number(pageValue) : 1,
    pageSize,
    search: readSingle(params, 'search')?.trim() ?? '',
    ...(unit && unit.length <= 10 ? { unit } : {}),
  };
}

export function writeIngredientSearchParams(
  query: IngredientListQuery,
): URLSearchParams {
  const raw = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    search: query.search,
  });
  if (query.unit !== undefined) raw.set('unit', query.unit);
  const normalized = parseIngredientSearchParams(raw);
  const params = new URLSearchParams();
  if (normalized.page !== 1) params.set('page', String(normalized.page));
  if (normalized.pageSize !== 10)
    params.set('pageSize', String(normalized.pageSize));
  if (normalized.search) params.set('search', normalized.search);
  if (normalized.unit) params.set('unit', normalized.unit);
  return params;
}

export function getIngredientReturnTo(value: unknown): string {
  if (
    typeof value !== 'string' ||
    /[#\\]/.test(value) ||
    Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  )
    return LIST_PATH;
  const question = value.indexOf('?');
  const path = question === -1 ? value : value.slice(0, question);
  if (path !== LIST_PATH) return LIST_PATH;
  const params = new URLSearchParams(
    question === -1 ? '' : value.slice(question + 1),
  );
  for (const [key, parameter] of params) {
    if (
      !['page', 'pageSize', 'search', 'unit'].includes(key) ||
      params.getAll(key).length !== 1
    )
      return LIST_PATH;
    if (key === 'page' && !isPositiveInteger(parameter)) return LIST_PATH;
    if (
      key === 'pageSize' &&
      (!isPositiveInteger(parameter) || !PAGE_SIZES.includes(Number(parameter)))
    )
      return LIST_PATH;
    if (key === 'unit' && (!parameter.trim() || parameter.trim().length > 10))
      return LIST_PATH;
  }
  const query = writeIngredientSearchParams(
    parseIngredientSearchParams(params),
  ).toString();
  return query ? `${LIST_PATH}?${query}` : LIST_PATH;
}
