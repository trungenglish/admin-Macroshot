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
) {
  try {
    return { data: await operation(await getIngredientTransport()) };
  } catch (error) {
    return { error: normalizeIngredientApiError(error) };
  }
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
      queryFn: (query) => withTransport((transport) => transport.list(query)),
      providesTags: (result) => [
        { type: 'Ingredient', id: 'LIST' },
        ...(result?.items.map(({ id }) => ({
          type: 'Ingredient' as const,
          id,
        })) ?? []),
      ],
    }),
    getIngredient: builder.query<Ingredient, number>({
      queryFn: (id) => withTransport((transport) => transport.detail(id)),
      providesTags: (_result, _error, id) => [{ type: 'Ingredient', id }],
    }),
    createIngredient: builder.mutation<Ingredient, IngredientSaveInput>({
      queryFn: (input) => withTransport((transport) => transport.create(input)),
      invalidatesTags: (_result, error) =>
        error ? [] : [{ type: 'Ingredient', id: 'LIST' }],
      onQueryStarted: refreshNutrientsAfterSave,
    }),
    updateIngredient: builder.mutation<
      Ingredient,
      { id: number; input: IngredientSaveInput }
    >({
      queryFn: ({ id, input }) =>
        withTransport((transport) => transport.update(id, input)),
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
      queryFn: (id) => withTransport((transport) => transport.delete(id)),
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
