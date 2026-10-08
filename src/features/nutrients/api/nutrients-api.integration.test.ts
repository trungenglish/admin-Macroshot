import { configureStore } from '@reduxjs/toolkit';
import {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import authReducer from '@/features/auth/store/auth-slice';
import { apiClient } from '@/shared/api/api-client';
import type { NutrientListQuery } from '../nutrient.types';
import { nutrientsApi } from './nutrients-api';

function createTestStore(accessToken: string | null = null) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [nutrientsApi.reducerPath]: nutrientsApi.reducer,
    },
    preloadedState: {
      auth: { accessToken, user: null, status: 'idle' as const, error: null },
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(nutrientsApi.middleware),
  });
  cleanup.push(() => store.dispatch(nutrientsApi.util.resetApiState()));
  return store;
}

function response(data: unknown, status = 200): AxiosResponse {
  return {
    data,
    status,
    statusText: status === 409 ? 'Conflict' : 'OK',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
}

const cleanup: Array<() => void> = [];
const ironDto = {
  id: 7,
  name: 'Iron',
  unit: 'mg',
  is_active: true,
  ingredient_count: 0,
};
const firstPage: NutrientListQuery = { page: 1, pageSize: 10, search: '' };

afterEach(() => {
  // Unsubscribe before resetting the API, then restore the external boundary.
  for (const dispose of cleanup.reverse()) dispose();
  cleanup.length = 0;
  vi.restoreAllMocks();
});

describe('nutrient endpoint/store integration', () => {
  it('unwraps the production list envelope and defaults omitted display metadata', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue(
      response({
        success: true,
        data: {
          items: [{ id: 7, name: 'Iron', unit: 'mg' }],
          meta: {
            total: 1,
            skip: 0,
            limit: 10,
            count: 1,
            total_pages: 1,
            current_page: 1,
            has_next: false,
            has_prev: false,
          },
        },
        message: 'OK',
        timestamp: '2026-10-03T00:00:00Z',
      }),
    );
    const store = createTestStore();
    const subscription = store.dispatch(
      nutrientsApi.endpoints.getNutrients.initiate(firstPage),
    );
    cleanup.push(() => subscription.unsubscribe());

    await expect(subscription.unwrap()).resolves.toEqual({
      items: [
        {
          id: 7,
          name: 'Iron',
          unit: 'mg',
          isActive: true,
          ingredientCount: 0,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    });
  });

  // Break caught: removing token forwarding or emitting a bearer header for null.
  it.each([
    {
      token: 'admin-access-token',
      headers: { Authorization: 'Bearer admin-access-token' },
    },
    { token: null, headers: undefined },
  ])(
    'emits conditional Authorization for token $token',
    async ({ token, headers }) => {
      const requests: AxiosRequestConfig[] = [];
      vi.spyOn(apiClient, 'request').mockImplementation(async (config) => {
        requests.push(config);
        return response(ironDto);
      });
      const store = createTestStore(token);
      const subscription = store.dispatch(
        nutrientsApi.endpoints.getNutrient.initiate(7),
      );
      cleanup.push(() => subscription.unsubscribe());

      await expect(subscription.unwrap()).resolves.toEqual({
        id: 7,
        name: 'Iron',
        unit: 'mg',
        isActive: true,
        ingredientCount: 0,
      });
      expect(requests).toEqual([
        {
          url: '/api/v1/nutrients/7',
          method: 'GET',
          data: undefined,
          params: undefined,
          headers,
        },
      ]);
    },
  );

  // Break caught: wrong skip arithmetic, lost false filter, or leaking empty filters.
  it.each([
    {
      query: {
        page: 3,
        pageSize: 25,
        search: 'iron',
        unit: 'mg',
        isActive: false,
      } as NutrientListQuery,
      params: {
        skip: 50,
        limit: 25,
        query: 'iron',
      },
      page: 3,
      pageSize: 25,
    },
    { query: firstPage, params: { skip: 0, limit: 10 }, page: 1, pageSize: 10 },
  ])(
    'emits paging and filter params $params',
    async ({ query, params, page, pageSize }) => {
      const requests: AxiosRequestConfig[] = [];
      vi.spyOn(apiClient, 'request').mockImplementation(async (config) => {
        requests.push(config);
        return response({
          items: [ironDto],
          total: 51,
          skip: params.skip,
          limit: params.limit,
        });
      });
      const store = createTestStore();
      const subscription = store.dispatch(
        nutrientsApi.endpoints.getNutrients.initiate(query),
      );
      cleanup.push(() => subscription.unsubscribe());

      await expect(subscription.unwrap()).resolves.toEqual({
        items: [
          {
            id: 7,
            name: 'Iron',
            unit: 'mg',
            isActive: true,
            ingredientCount: 0,
          },
        ],
        total: 51,
        page,
        pageSize,
      });
      expect(requests).toEqual([
        {
          url: '/api/v1/nutrients/',
          method: 'GET',
          data: undefined,
          params,
          headers: undefined,
        },
      ]);
    },
  );

  // Break caught: sending isActive instead of is_active, or dropping false.
  it('PATCH maps domain status to is_active on the wire', async () => {
    const requests: AxiosRequestConfig[] = [];
    vi.spyOn(apiClient, 'request').mockImplementation(async (config) => {
      requests.push(config);
      return response({ ...ironDto, name: 'Iron updated', is_active: false });
    });
    const store = createTestStore();
    const mutation = store.dispatch(
      nutrientsApi.endpoints.updateNutrient.initiate({
        id: 7,
        name: 'Iron updated',
        unit: 'mg',
        isActive: false,
      }),
    );
    cleanup.push(() => mutation.reset());

    await expect(mutation.unwrap()).resolves.toEqual({
      id: 7,
      name: 'Iron updated',
      unit: 'mg',
      isActive: false,
      ingredientCount: 0,
    });
    expect(requests).toEqual([
      {
        url: '/api/v1/nutrients/7',
        method: 'PATCH',
        data: { name: 'Iron updated', unit: 'mg', is_active: false },
        params: undefined,
        headers: undefined,
      },
    ]);
  });

  // Break caught: success-only DELETE invalidation, optimistic removal, or lost 409.
  it('DELETE 409 rejects unwrap and refetches the subscribed list without removing its row', async () => {
    const requests: AxiosRequestConfig[] = [];
    let finishRefetch!: (value: AxiosResponse) => void;
    const refetchResponse = new Promise<AxiosResponse>((resolve) => {
      finishRefetch = resolve;
    });
    const fixtures = [
      () =>
        Promise.resolve(
          response({ items: [ironDto], total: 1, skip: 0, limit: 10 }),
        ),
      () =>
        Promise.reject(
          new AxiosError(
            'Request failed with status code 409',
            'ERR_BAD_REQUEST',
            undefined,
            undefined,
            response({ detail: 'Nutrient is used by ingredients.' }, 409),
          ),
        ),
      () => refetchResponse,
    ];
    vi.spyOn(apiClient, 'request').mockImplementation((config) => {
      requests.push(config);
      const fixture = fixtures.shift();
      if (!fixture) throw new Error('Unexpected extra nutrient request');
      return fixture();
    });
    const store = createTestStore();
    const subscription = store.dispatch(
      nutrientsApi.endpoints.getNutrients.initiate(firstPage),
    );
    cleanup.push(() => subscription.unsubscribe());
    await subscription.unwrap();

    const mutation = store.dispatch(
      nutrientsApi.endpoints.deleteNutrient.initiate(7),
    );
    cleanup.push(() => mutation.reset());
    const selectList = () =>
      nutrientsApi.endpoints.getNutrients.select(firstPage)(store.getState());
    try {
      await expect(mutation.unwrap()).rejects.toEqual({
        status: 409,
        message: 'Nutrient is used by ingredients.',
      });
      await vi.waitFor(() => expect(selectList().status).toBe('pending'));
      expect(selectList().data?.items).toEqual([
        { id: 7, name: 'Iron', unit: 'mg', isActive: true, ingredientCount: 0 },
      ]);
    } finally {
      // Always settle the finite fixture, even when the invalidation assertion fails.
      finishRefetch(
        response({
          items: [{ ...ironDto, ingredient_count: 4 }],
          total: 1,
          skip: 0,
          limit: 10,
        }),
      );
      await Promise.all(
        store.dispatch(nutrientsApi.util.getRunningQueriesThunk()),
      );
    }

    expect(selectList().status).toBe('fulfilled');
    expect(selectList().data).toEqual({
      items: [
        { id: 7, name: 'Iron', unit: 'mg', isActive: true, ingredientCount: 4 },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    });
    expect(
      requests.map(({ url, method, params }) => ({ url, method, params })),
    ).toEqual([
      {
        url: '/api/v1/nutrients/',
        method: 'GET',
        params: { skip: 0, limit: 10 },
      },
      {
        url: '/api/v1/nutrients/7',
        method: 'DELETE',
        params: undefined,
      },
      {
        url: '/api/v1/nutrients/',
        method: 'GET',
        params: { skip: 0, limit: 10 },
      },
    ]);
  });
});
