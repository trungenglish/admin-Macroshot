import { describe, expect, it } from 'vitest';

import {
  normalizeIngredient,
  normalizeIngredientApiError,
} from './ingredient-adapter';

const dto = {
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
  fat_per_100g: 0,
};
const nutrient = {
  id: 1,
  name: 'Iron',
  unit: 'mg',
  isActive: true,
  ingredientCount: 1,
};

describe('supplied Ingredient response adapter', () => {
  // Break caught: guessed metadata defaults turn an unavailable usage check into permission to delete.
  it('maps supplied snake_case fields while keeping absent metadata unknown', () => {
    expect(normalizeIngredient(dto)).toEqual({
      id: 1,
      name: 'Tomato',
      unit: 'g',
      userId: null,
      isSystem: true,
      imageUrl: null,
      defaultWeightPerServing: '100',
      lastInputType: '100g',
      calPer100g: 18,
      proPer100g: 1,
      carbPer100g: 4,
      fatPer100g: 0,
      nutrientLinks: null,
      recipeCount: null,
    });
  });

  // Break caught: normalization rounds a decimal or interprets unsupported notation.
  it('normalizes exact decimals lexically without rounding', () => {
    const result = normalizeIngredient(
      { ...dto, default_weight_per_serving: '00012.30' },
      { nutrientLinks: [{ nutrient, amount: '000001.2300' }], recipeCount: 0 },
    );
    expect(result.defaultWeightPerServing).toBe('12.3');
    expect(result.nutrientLinks![0].amount).toBe('1.23');
    expect(result.recipeCount).toBe(0);
  });

  it.each(['1.234', '999999.99', '1e2', -1, Number.NaN])(
    'rejects invalid/precision-losing weight %s',
    (value) => {
      expect(() =>
        normalizeIngredient({ ...dto, default_weight_per_serving: value }),
      ).toThrow('Ingredient decimal is unavailable or would lose precision.');
    },
  );

  // Break caught: invalid links/usage silently become an empty collection or a safe count.
  it.each([
    { nutrientLinks: 'unknown', recipeCount: -1 },
    { nutrientLinks: [{ nutrient, amount: '0.12345' }], recipeCount: '0' },
    {
      nutrientLinks: [
        { nutrient: { ...nutrient, isActive: 'false' }, amount: '1' },
      ],
      recipeCount: 0.5,
    },
    {
      nutrientLinks: [
        { nutrient, amount: '1' },
        { nutrient, amount: '2' },
      ],
      recipeCount: Number.NaN,
    },
  ])(
    'preserves unavailable status for malformed supplemental metadata',
    (metadata) => {
      const result = normalizeIngredient(dto, metadata);
      expect(result.nutrientLinks).toBeNull();
      expect(result.recipeCount).toBeNull();
    },
  );

  it('preserves non-negative decimal macro values', () => {
    expect(normalizeIngredient({ ...dto, fat_per_100g: 3.6 }).fatPer100g).toBe(
      3.6,
    );
  });

  // Break caught: invalid macros get silently coerced or accepted.
  it.each([-1, Number.POSITIVE_INFINITY, Number.NaN, '1'])(
    'rejects invalid macro %s',
    (value) => {
      expect(() =>
        normalizeIngredient({ ...dto, cal_per_100g: value }),
      ).toThrow('Ingredient response is unavailable or malformed.');
    },
  );
});

describe('Ingredient error normalization', () => {
  // Break caught: a numeric API error becomes an opaque transport failure.
  it.each([401, 403, 404, 409, 422])(
    'preserves numeric status %s',
    (status) => {
      expect(
        normalizeIngredientApiError({
          status,
          message: 'Denied',
          fieldErrors: { name: 'Invalid' },
        }),
      ).toEqual({
        status,
        message: 'Denied',
        fieldErrors: { name: 'Invalid' },
      });
    },
  );
  it('normalizes unexpected failures into a typed transport error', () => {
    expect(normalizeIngredientApiError(new Error('Disconnected'))).toEqual({
      status: 'TRANSPORT_ERROR',
      message: 'Disconnected',
    });
  });
});
