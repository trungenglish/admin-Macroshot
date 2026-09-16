import { describe, expect, it } from 'vitest';

import { getNutrientActionPolicy } from './nutrient-policy';
import {
  parseNutrientSearchParams,
  writeNutrientSearchParams,
} from './nutrient-query';
import { nutrientFormSchema } from './nutrient.schema';

describe('nutrient domain', () => {
  it('rejects a blank name and unsupported unit', () => {
    expect(
      nutrientFormSchema.safeParse({ name: '   ', unit: 'kg' }).success,
    ).toBe(false);
  });

  it('trims a valid nutrient name', () => {
    expect(
      nutrientFormSchema.parse({ name: '  Vitamin C  ', unit: 'mg' }),
    ).toEqual({ name: 'Vitamin C', unit: 'mg' });
  });

  it('uses safe defaults for invalid URL parameters', () => {
    expect(
      parseNutrientSearchParams(
        new URLSearchParams('page=-2&pageSize=999&unit=kg&isActive=x'),
      ),
    ).toEqual({ page: 1, pageSize: 10, search: '' });
  });

  it('round-trips valid URL state', () => {
    const query = {
      page: 3,
      pageSize: 25,
      search: 'vitamin',
      unit: 'mg' as const,
      isActive: false,
    };

    expect(parseNutrientSearchParams(writeNutrientSearchParams(query))).toEqual(
      query,
    );
  });

  it('allows deletion only when no ingredient uses the nutrient', () => {
    expect(
      getNutrientActionPolicy({ isActive: true, ingredientCount: 4 }),
    ).toEqual({ statusAction: 'deactivate', canDelete: false });
    expect(
      getNutrientActionPolicy({ isActive: false, ingredientCount: 0 }),
    ).toEqual({ statusAction: 'reactivate', canDelete: true });
  });
});
