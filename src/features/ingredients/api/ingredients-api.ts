import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { nutrientsApi } from '@/features/nutrients/api/nutrients-api';
import type {
  Ingredient,
  IngredientListQuery,
  IngredientListResult,
  IngredientSaveInput,
} from '../ingredient.types';
import { normalizeIngredientApiError } from './ingredient-adapter';
import {
  getIngredientTransport,
  type IngredientApiError,
  type IngredientTransport,
} from './ingredient-transport';

async function withTransport<T>(
  operation: (transport: IngredientTransport) => Promise<T>,
  accessToken: string | null,
) {
  try {
    return {
      data: await operation(await getIngredientTransport(accessToken)),
    };
  } catch (error) {
    return { error: normalizeIngredientApiError(error) };
  }
}

function getAccessToken(state: unknown): string | null {
  return (
    state as { auth?: { accessToken?: string | null } }
  ).auth?.accessToken ?? null;
}

// A mutation can remove old links whose ids are not in its response. Invalidate
// the whole Nutrient tag type so both list and any subscribed detail refresh.
async function refreshNutrientsAfterSave(
  _arg: unknown,
  lifecycle: {
    dispatch: (
      action: ReturnType<typeof nutrientsApi.util.invalidateTags>,
    ) => unknown;
    queryFulfilled: Promise<unknown>;
  },
) {
  try {
    await lifecycle.queryFulfilled;
    lifecycle.dispatch(nutrientsApi.util.invalidateTags(['Nutrient']));
  } catch {
    /* A rejected mutation must not announce success. */
  }
}

export const ingredientsApi = createApi({
  reducerPath: 'ingredientsApi',
  baseQuery: fakeBaseQuery<IngredientApiError>(),
  tagTypes: ['Ingredient'],
  endpoints: (builder) => ({
    listIngredients: builder.query<IngredientListResult, IngredientListQuery>({
      queryFn: (query, api) =>
        withTransport(
          (transport) => transport.list(query),
          getAccessToken(api.getState()),
        ),
      providesTags: (result) => [
        { type: 'Ingredient', id: 'LIST' },
        ...(result?.items.map(({ id }) => ({
          type: 'Ingredient' as const,
          id,
        })) ?? []),
      ],
    }),
    getIngredient: builder.query<Ingredient, number>({
      queryFn: (id, api) =>
        withTransport(
          (transport) => transport.detail(id),
          getAccessToken(api.getState()),
        ),
      providesTags: (_result, _error, id) => [{ type: 'Ingredient', id }],
    }),
    createIngredient: builder.mutation<Ingredient, IngredientSaveInput>({
      queryFn: (input, api) =>
        withTransport(
          (transport) => transport.create(input),
          getAccessToken(api.getState()),
        ),
      invalidatesTags: (_result, error) =>
        error ? [] : [{ type: 'Ingredient', id: 'LIST' }],
      onQueryStarted: refreshNutrientsAfterSave,
    }),
    updateIngredient: builder.mutation<
      Ingredient,
      { id: number; input: IngredientSaveInput }
    >({
      queryFn: ({ id, input }, api) =>
        withTransport(
          (transport) => transport.update(id, input),
          getAccessToken(api.getState()),
        ),
      invalidatesTags: (_result, error, { id }) =>
        error
          ? []
          : [
              { type: 'Ingredient', id: 'LIST' },
              { type: 'Ingredient', id },
            ],
      onQueryStarted: refreshNutrientsAfterSave,
    }),
    deleteIngredient: builder.mutation<void, number>({
      queryFn: (id, api) =>
        withTransport(
          (transport) => transport.delete(id),
          getAccessToken(api.getState()),
        ),
      invalidatesTags: (_result, error, id) =>
        error
          ? []
          : [
              { type: 'Ingredient', id: 'LIST' },
              { type: 'Ingredient', id },
            ],
      onQueryStarted: refreshNutrientsAfterSave,
    }),
  }),
});

export const {
  useListIngredientsQuery,
  useGetIngredientQuery,
  useCreateIngredientMutation,
  useUpdateIngredientMutation,
  useDeleteIngredientMutation,
} = ingredientsApi;
