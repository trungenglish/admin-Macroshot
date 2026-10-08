import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/api-client';
import type { IngredientSaveInput } from '../ingredient.types';
import { createHttpIngredientTransport } from './ingredient-transport';

const ingredientDto = {
  id: 1,
  name: 'Tomato',
  unit: 'g',
  user_id: null,
  is_system: true,
  image_url: null,
  default_weight_per_serving: 100,
  last_input_type: '100g',
  cal_per_100g: 18,
  pro_per_100g: 1,
  carb_per_100g: 4,
  fat_per_100g: 3.6,
};

const input: IngredientSaveInput = {
  name: 'Tomato',
  unit: 'g',
  defaultWeightPerServing: '100',
  calPer100g: 18,
  proPer100g: 1,
  carbPer100g: 4,
  fatPer100g: 0,
  nutrientLinks: [],
  isSystem: true,
  userId: null,
  inputType: '100g',
};

afterEach(() => vi.restoreAllMocks());

describe('HTTP ingredient transport', () => {
  it('lists ingredients with query pagination and bearer authentication', async () => {
    const request = vi.spyOn(apiClient, 'request').mockResolvedValue({
      data: {
        status: 'success',
        message: 'Retrieved 1 ingredient',
        data: {
          items: [ingredientDto],
          meta: { total: 1, skip: 20, limit: 10, count: 1 },
        },
      },
    });

    const result = await createHttpIngredientTransport('token').list({
      page: 3,
      pageSize: 10,
      search: 'tomato',
      unit: 'g',
    });

    expect(request).toHaveBeenCalledWith({
      url: '/api/v1/ingredients/',
      method: 'GET',
      params: { query: 'tomato', skip: 20, limit: 10 },
      headers: { Authorization: 'Bearer token' },
    });
    expect(result).toMatchObject({
      total: 1,
      page: 3,
      pageSize: 10,
      items: [{ id: 1, fatPer100g: 3.6 }],
    });
  });

  it('maps create input to the ingredient API wire format', async () => {
    const request = vi
      .spyOn(apiClient, 'request')
      .mockResolvedValue({ data: ingredientDto });

    await createHttpIngredientTransport('token').create(input);

    expect(request).toHaveBeenCalledWith({
      url: '/api/v1/ingredients/',
      method: 'POST',
      data: {
        name: 'Tomato',
        unit: 'g',
        default_weight_per_serving: '100',
        cal_per_100g: 18,
        pro_per_100g: 1,
        carb_per_100g: 4,
        fat_per_100g: 0,
        nutrient_links: [],
        is_system: true,
        user_id: null,
        last_input_type: '100g',
      },
      headers: { Authorization: 'Bearer token' },
    });
  });
});
