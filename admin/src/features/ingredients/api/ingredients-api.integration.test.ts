import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { nutrientsApi } from '@/features/nutrients/api/nutrients-api';
import { apiClient } from '@/shared/api/api-client';
import {
  ingredientTransportFixture as preview,
  resetIngredientFixtures,
} from '@/test/fixtures/ingredient-transport.fixture';
import { nutrientsApiFixtureAdapter } from '@/test/fixtures/nutrients-api.fixture-adapter';
import type { IngredientSaveInput } from '../ingredient.types';
import { ingredientsApi } from './ingredients-api';

vi.mock('./ingredient-transport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./ingredient-transport')>()),
  getIngredientTransport: async () =>
    (await import('@/test/fixtures/ingredient-transport.fixture'))
      .ingredientTransportFixture,
}));

const query = { page: 1, pageSize: 10, search: 'Test' };
const nutrientQuery = { page: 1, pageSize: 10, search: '' };
const input: IngredientSaveInput = {
  name: 'Test lentils',
  unit: 'g',
  defaultWeightPerServing: '100',
  calPer100g: 120,
  proPer100g: 9,
  carbPer100g: 20,
  fatPer100g: 1,
  nutrientLinks: [],
  isSystem: true,
  userId: null,
  inputType: '100g',
};
const originalAdapter = apiClient.defaults.adapter;
const cleanup: Array<() => void> = [];
function createTestStore() {
  const store = configureStore({
    reducer: {
      [ingredientsApi.reducerPath]: ingredientsApi.reducer,
      [nutrientsApi.reducerPath]: nutrientsApi.reducer,
      auth: () => ({ accessToken: null }),
    },
    middleware: (getDefault) =>
      getDefault().concat(ingredientsApi.middleware, nutrientsApi.middleware),
  });
  cleanup.push(() => {
    store.dispatch(ingredientsApi.util.resetApiState());
    store.dispatch(nutrientsApi.util.resetApiState());
  });
  return store;
}
beforeEach(() => {
  resetIngredientFixtures();
  apiClient.defaults.adapter = nutrientsApiFixtureAdapter;
});
afterEach(() => {
  cleanup.reverse().forEach((dispose) => dispose());
  cleanup.length = 0;
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});

describe('Ingredient RTK integration', () => {
  // Break caught: successful mutations do not invalidate subscribed Ingredient or Nutrient data.
  it('create/update/delete refresh subscribed lists, detail, and Nutrient counts', async () => {
    const store = createTestStore();
    const list = store.dispatch(
      ingredientsApi.endpoints.listIngredients.initiate(query),
    );
    const nutrientList = store.dispatch(
      nutrientsApi.endpoints.getNutrients.initiate(nutrientQuery),
    );
    const nutrientDetail = store.dispatch(
      nutrientsApi.endpoints.getNutrient.initiate(1),
    );
    const secondNutrientDetail = store.dispatch(
      nutrientsApi.endpoints.getNutrient.initiate(2),
    );
    cleanup.push(() => {
      list.unsubscribe();
      nutrientList.unsubscribe();
      nutrientDetail.unsubscribe();
      secondNutrientDetail.unsubscribe();
    });
    const [, , iron, calcium] = await Promise.all([
      list.unwrap(),
      nutrientList.unwrap(),
      nutrientDetail.unwrap(),
      secondNutrientDetail.unwrap(),
    ]);
    expect(iron.ingredientCount).toBe(1);
    expect(calcium.ingredientCount).toBe(0);
    const selectList = () =>
      ingredientsApi.endpoints.listIngredients.select(query)(store.getState());
    const nutrientCounts = () =>
      nutrientsApi.endpoints.getNutrients
        .select(nutrientQuery)(store.getState())
        .data?.items.slice(0, 2)
        .map((item) => item.ingredientCount);
    const detailCount = (id: number) =>
      nutrientsApi.endpoints.getNutrient.select(id)(store.getState()).data
        ?.ingredientCount;

    const created = await store
      .dispatch(
        ingredientsApi.endpoints.createIngredient.initiate({
          ...input,
          nutrientLinks: [{ nutrient: iron, amount: '2.25' }],
        }),
      )
      .unwrap();
    await vi.waitFor(() => {
      expect(selectList().data?.items.map((item) => item.name)).toEqual([
        'Test lentils',
      ]);
      expect(nutrientCounts()).toEqual([2, 0]);
      expect(detailCount(1)).toBe(2);
    });
    const detail = store.dispatch(
      ingredientsApi.endpoints.getIngredient.initiate(created.id),
    );
    cleanup.push(() => detail.unsubscribe());
    await detail.unwrap();
    const selectDetail = () =>
      ingredientsApi.endpoints.getIngredient.select(created.id)(
        store.getState(),
      );
    await store
      .dispatch(
        ingredientsApi.endpoints.updateIngredient.initiate({
          id: created.id,
          input: {
            ...input,
            name: 'Test lentils edited',
            nutrientLinks: [{ nutrient: calcium, amount: '1.125' }],
          },
        }),
      )
      .unwrap();
    await vi.waitFor(() => {
      expect(selectList().data?.items[0].name).toBe('Test lentils edited');
      expect(selectDetail().data?.name).toBe('Test lentils edited');
      expect(selectDetail().data?.nutrientLinks?.[0].amount).toBe('1.125');
      expect(nutrientCounts()).toEqual([1, 1]);
      expect(detailCount(1)).toBe(1);
      expect(detailCount(2)).toBe(1);
    });
    await store
      .dispatch(ingredientsApi.endpoints.deleteIngredient.initiate(created.id))
      .unwrap();
    await vi.waitFor(() => {
      expect(selectList().data?.items).toEqual([]);
      expect(selectDetail().error).toMatchObject({ status: 404 });
      expect(nutrientCounts()).toEqual([1, 0]);
      expect(detailCount(2)).toBe(0);
    });
  });

  // Break caught: a 409 invalidates caches as if successful or removes the cached row.
  it('409 keeps cached rows/detail and never starts a success refetch', async () => {
    const store = createTestStore();
    const allQuery = { ...query, search: '' };
    const list = store.dispatch(
      ingredientsApi.endpoints.listIngredients.initiate(allQuery),
    );
    const detail = store.dispatch(
      ingredientsApi.endpoints.getIngredient.initiate(2),
    );
    const nutrient = store.dispatch(
      nutrientsApi.endpoints.getNutrient.initiate(13),
    );
    cleanup.push(() => {
      list.unsubscribe();
      detail.unsubscribe();
      nutrient.unsubscribe();
    });
    await Promise.all([list.unwrap(), detail.unwrap(), nutrient.unwrap()]);
    const select = () => [
      ingredientsApi.endpoints.listIngredients.select(allQuery)(
        store.getState(),
      ),
      ingredientsApi.endpoints.getIngredient.select(2)(store.getState()),
      nutrientsApi.endpoints.getNutrient.select(13)(store.getState()),
    ];
    const before = select();
    await expect(
      store
        .dispatch(ingredientsApi.endpoints.deleteIngredient.initiate(2))
        .unwrap(),
    ).rejects.toEqual({
      status: 409,
      message: 'This ingredient is used by a recipe and cannot be deleted.',
    });
    expect(select()).toEqual(before);
    expect(
      ingredientsApi.endpoints.listIngredients
        .select(allQuery)(store.getState())
        .data?.items.some((item) => item.id === 2),
    ).toBe(true);
  });

  // Break caught: queryFn throws an untyped error, discards status/fieldErrors, or reports success.
  it.each([401, 403, 404, 409, 422])(
    'returns typed rejected status %s',
    async (status) => {
      vi.spyOn(preview, 'create').mockRejectedValue({
        status,
        message: 'Denied',
        fieldErrors: { name: 'Check name' },
      });
      const store = createTestStore();
      await expect(
        store
          .dispatch(ingredientsApi.endpoints.createIngredient.initiate(input))
          .unwrap(),
      ).rejects.toEqual({
        status,
        message: 'Denied',
        fieldErrors: { name: 'Check name' },
      });
    },
  );
});
