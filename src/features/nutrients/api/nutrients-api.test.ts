import { describe, expect, it } from 'vitest';

import {
  normalizeApiErrorPayload,
  normalizeNutrient,
  normalizeNutrientList,
} from './nutrients-api';

describe('nutrient API adapters', () => {
  it('maps snake_case nutrient fields', () => {
    expect(
      normalizeNutrient({
        id: 7,
        name: 'Iron',
        unit: 'mg',
        is_active: false,
        ingredient_count: 3,
      }),
    ).toEqual({
      id: 7,
      name: 'Iron',
      unit: 'mg',
      isActive: false,
      ingredientCount: 3,
    });
  });

  it('maps pagination metadata', () => {
    expect(
      normalizeNutrientList({
        items: [
          {
            id: 1,
            name: 'Protein',
            unit: 'g',
            is_active: true,
            ingredient_count: 10,
          },
        ],
        total: 21,
        skip: 10,
        limit: 10,
      }),
    ).toMatchObject({ total: 21, page: 2, pageSize: 10 });
  });

  it('maps backend validation issues to form fields', () => {
    expect(
      normalizeApiErrorPayload(422, {
        detail: [
          { loc: ['body', 'name'], msg: 'Name already exists.' },
          { loc: ['body', 'unit'], msg: 'Unsupported unit.' },
        ],
      }),
    ).toEqual({
      status: 422,
      message: 'Check the highlighted fields.',
      fieldErrors: {
        name: 'Name already exists.',
        unit: 'Unsupported unit.',
      },
    });
  });
});
