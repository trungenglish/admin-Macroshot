import { USER_PAGE_SIZES, type UserListQuery } from './user.types';

function positiveInteger(value: string | null, fallback: number) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

export function parseUserSearchParams(params: URLSearchParams): UserListQuery {
  const requestedPageSize = positiveInteger(params.get('pageSize'), 10);
  return {
    page: positiveInteger(params.get('page'), 1),
    pageSize: USER_PAGE_SIZES.includes(
      requestedPageSize as (typeof USER_PAGE_SIZES)[number],
    )
      ? requestedPageSize
      : 10,
    search: params.get('search')?.trim() ?? '',
  };
}

export function writeUserSearchParams(query: UserListQuery) {
  const params = new URLSearchParams();
  if (query.page !== 1) params.set('page', String(query.page));
  if (query.pageSize !== 10) params.set('pageSize', String(query.pageSize));
  if (query.search) params.set('search', query.search);
  return params;
}
