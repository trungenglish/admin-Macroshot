import { describe, expect, it } from 'vitest';

import {
  createIngredientDefaults,
  ingredientToFormValues,
  toIngredientSaveInput,
} from './ingredient-form';
import {
  getIngredientDeletePolicy,
  isSystemIngredient,
} from './ingredient-policy';
import {
  getIngredientReturnTo,
  parseIngredientSearchParams,
  writeIngredientSearchParams,
} from './ingredient-query';
import { ingredientFormSchema } from './ingredient.schema';
import type { Ingredient, IngredientFormValues } from './ingredient.types';

const nutrient = {
  id: 1,
  name: 'Iron',
  unit: 'mg' as const,
  isActive: false,
  ingredientCount: 2,
};
const validValues: IngredientFormValues = {
  name: 'Rice',
  unit: 'g',
  defaultWeightPerServing: '100',
  calPer100g: '130',
  proPer100g: '3',
  carbPer100g: '28',
  fatPer100g: '0',
  nutrientLinks: [{ nutrient, amount: '0.1234' }],
};
const ingredient: Ingredient = {
  id: 12,
  name: 'Rice',
  unit: 'g',
  userId: null,
  isSystem: true,
  imageUrl: null,
  defaultWeightPerServing: '45.50',
  lastInputType: 'serving',
  calPer100g: 130,
  proPer100g: 3,
  carbPer100g: 28,
  fatPer100g: 0,
  nutrientLinks: [{ nutrient, amount: '0.1234' }],
  recipeCount: 0,
};

describe('ingredient form validation', () => {
  it('starts with unknown macros blank instead of manufacturing zeros', () => {
    expect(createIngredientDefaults()).toMatchObject({
      name: '',
      unit: 'g',
      defaultWeightPerServing: '100',
      calPer100g: '',
      proPer100g: '',
      carbPer100g: '',
      fatPer100g: '',
      nutrientLinks: [],
    });
    expect(
      ingredientFormSchema.safeParse(createIngredientDefaults()).success,
    ).toBe(false);
  });

  for (const field of [
    'calPer100g',
    'proPer100g',
    'carbPer100g',
    'fatPer100g',
  ] as const) {
    it.each([
      '',
      '   ',
      '-1',
      '1.5',
      'NaN',
      'Infinity',
      '1e3',
      '1,000',
      '1.',
      '9007199254740992',
    ])(`rejects invalid ${field}: %j`, (value) => {
      expect(
        ingredientFormSchema.safeParse({ ...validValues, [field]: value })
          .success,
      ).toBe(false);
    });
    it(`accepts safe whole-number ${field} boundaries`, () => {
      expect(
        ingredientFormSchema.safeParse({ ...validValues, [field]: '0' })
          .success,
      ).toBe(true);
      expect(
        ingredientFormSchema.safeParse({
          ...validValues,
          [field]: '9007199254740991',
        }).success,
      ).toBe(true);
    });
  }

  it.each([
    '',
    ' ',
    '0',
    '0.09',
    '-1',
    '100000',
    '1.001',
    '1.',
    '1e2',
    '1,2',
    'Infinity',
  ])('rejects invalid serving weight %j', (defaultWeightPerServing) => {
    expect(
      ingredientFormSchema.safeParse({
        ...validValues,
        defaultWeightPerServing,
      }).success,
    ).toBe(false);
  });
  it.each(['0.1', '0.10', '99999.99', '45.50'])(
    'accepts serving weight %j',
    (defaultWeightPerServing) => {
      expect(
        ingredientFormSchema.safeParse({
          ...validValues,
          defaultWeightPerServing,
        }).success,
      ).toBe(true);
    },
  );

  it.each([
    '',
    ' ',
    '-0.1',
    '1000000',
    '0.12345',
    '1.',
    '1e2',
    '1,2',
    'NaN',
    'Infinity',
  ])('rejects invalid nutrient amount %j', (amount) => {
    expect(
      ingredientFormSchema.safeParse({
        ...validValues,
        nutrientLinks: [{ nutrient, amount }],
      }).success,
    ).toBe(false);
  });
  it.each(['0', '0.0000', '0.1234', '999999.9999'])(
    'accepts exact amount %j',
    (amount) => {
      expect(
        ingredientFormSchema.safeParse({
          ...validValues,
          nutrientLinks: [{ nutrient, amount }],
        }).success,
      ).toBe(true);
    },
  );
  it('rejects duplicate nutrient IDs even when their amounts differ', () => {
    expect(
      ingredientFormSchema.safeParse({
        ...validValues,
        nutrientLinks: [
          { nutrient, amount: '1' },
          { nutrient: { ...nutrient }, amount: '2' },
        ],
      }).success,
    ).toBe(false);
  });
  it('validates trimmed input without transforming the form values', () => {
    const values = {
      ...validValues,
      name: ' Rice ',
      unit: ' g ',
      calPer100g: ' 130 ',
      defaultWeightPerServing: ' 45.50 ',
      nutrientLinks: [{ nutrient, amount: ' 0.1234 ' }],
    };
    expect(ingredientFormSchema.parse(values)).toEqual(values);
  });
  it.each(['name', 'unit'] as const)('rejects blank %s', (field) => {
    expect(
      ingredientFormSchema.safeParse({ ...validValues, [field]: '   ' })
        .success,
    ).toBe(false);
  });
  it.each([
    { field: 'name', length: 255 },
    { field: 'unit', length: 10 },
  ] as const)('enforces trimmed $field length limits', ({ field, length }) => {
    expect(
      ingredientFormSchema.safeParse({
        ...validValues,
        [field]: ` ${'x'.repeat(length)} `,
      }).success,
    ).toBe(true);
    expect(
      ingredientFormSchema.safeParse({
        ...validValues,
        [field]: 'x'.repeat(length + 1),
      }).success,
    ).toBe(false);
  });
  it.each([0, -1, 0.5, NaN, Infinity, 9007199254740992])(
    'rejects invalid nutrient ID %j',
    (id) => {
      expect(
        ingredientFormSchema.safeParse({
          ...validValues,
          nutrientLinks: [{ nutrient: { ...nutrient, id }, amount: '1' }],
        }).success,
      ).toBe(false);
    },
  );
  it('allows free-text ingredient units independently of nutrient units', () => {
    expect(
      ingredientFormSchema.safeParse({ ...validValues, unit: 'slice' }).success,
    ).toBe(true);
  });
});

describe('ingredient save conversion', () => {
  it('trims values, enforces system scope, and preserves exact per-100g decimal amounts', () => {
    expect(
      toIngredientSaveInput({
        ...validValues,
        name: ' Rice ',
        unit: ' g ',
        defaultWeightPerServing: ' 45.50 ',
        nutrientLinks: [{ nutrient, amount: ' 0.1234 ' }],
      }),
    ).toEqual({
      name: 'Rice',
      unit: 'g',
      defaultWeightPerServing: '45.50',
      calPer100g: 130,
      proPer100g: 3,
      carbPer100g: 28,
      fatPer100g: 0,
      nutrientLinks: [{ nutrient, amount: '0.1234' }],
      isSystem: true,
      userId: null,
      inputType: '100g',
    });
  });
  it('validates before converting a blank macro to a number', () => {
    expect(() =>
      toIngredientSaveInput({ ...validValues, calPer100g: '' }),
    ).toThrow();
  });
  it('leaves serving-entered edit values unchanged rather than scaling macros or amounts', () => {
    expect(ingredientToFormValues(ingredient)).toEqual({
      name: 'Rice',
      unit: 'g',
      defaultWeightPerServing: '45.50',
      calPer100g: '130',
      proPer100g: '3',
      carbPer100g: '28',
      fatPer100g: '0',
      nutrientLinks: [{ nutrient, amount: '0.1234' }],
    });
  });
  it('rejects unknown link metadata instead of silently erasing links', () => {
    expect(() =>
      ingredientToFormValues({ ...ingredient, nutrientLinks: null }),
    ).toThrow();
  });
  it('does not alias editable links to the source ingredient', () => {
    const source = {
      ...ingredient,
      nutrientLinks: [{ nutrient: { ...nutrient }, amount: '0.1234' }],
    };
    const values = ingredientToFormValues(source);
    values.nutrientLinks[0].amount = '2';
    values.nutrientLinks[0].nutrient.name = 'Changed';
    expect(source.nutrientLinks[0]).toEqual({ nutrient, amount: '0.1234' });
  });
});

describe('ingredient ownership and deletion safety', () => {
  it.each([
    { isSystem: true, userId: null, expected: true },
    { isSystem: false, userId: null, expected: false },
    { isSystem: false, userId: 9, expected: false },
    { isSystem: true, userId: 9, expected: false },
  ])(
    'requires consistent system scope: $isSystem / $userId',
    ({ isSystem, userId, expected }) => {
      expect(isSystemIngredient({ isSystem, userId })).toBe(expected);
      expect(
        getIngredientDeletePolicy({ isSystem, userId, recipeCount: 0 })
          .canDelete,
      ).toBe(expected);
    },
  );
  it.each([null, NaN, -1, 0.5, Infinity, 9007199254740992, 1])(
    'blocks unsafe or used recipe count %j',
    (recipeCount) => {
      const policy = getIngredientDeletePolicy({
        isSystem: true,
        userId: null,
        recipeCount,
      });
      expect(policy.canDelete).toBe(false);
      expect(policy.reason).toEqual(expect.any(String));
    },
  );
  it('allows deletion only for known unused system records', () => {
    expect(
      getIngredientDeletePolicy({
        isSystem: true,
        userId: null,
        recipeCount: 0,
      }),
    ).toEqual({ canDelete: true, reason: null });
  });
});

describe('ingredient list URL state', () => {
  it('uses safe defaults for empty query state', () => {
    expect(parseIngredientSearchParams(new URLSearchParams())).toEqual({
      page: 1,
      pageSize: 10,
      search: '',
    });
    expect(
      writeIngredientSearchParams({
        page: 1,
        pageSize: 10,
        search: '',
      }).toString(),
    ).toBe('');
  });
  it.each([
    '-1',
    '0',
    '1.5',
    'NaN',
    'Infinity',
    '9007199254740992',
    '1e2',
    ' 2 ',
  ])('recovers invalid page %j', (page) => {
    expect(
      parseIngredientSearchParams(
        new URLSearchParams({ page, pageSize: '999' }),
      ),
    ).toEqual({ page: 1, pageSize: 10, search: '' });
  });
  it('writes valid list state and trims search on recovery', () => {
    expect(
      writeIngredientSearchParams({
        page: 3,
        pageSize: 25,
        search: 'rice',
        unit: 'g',
      }).toString(),
    ).toBe('page=3&pageSize=25&search=rice&unit=g');
    expect(
      parseIngredientSearchParams(
        new URLSearchParams('page=3&pageSize=25&search=+rice+&unit=g'),
      ),
    ).toEqual({ page: 3, pageSize: 25, search: 'rice', unit: 'g' });
  });
  it('resets stale filter values when writing default state', () => {
    expect(
      writeIngredientSearchParams({ page: 1, pageSize: 10, search: '' }).has(
        'unit',
      ),
    ).toBe(false);
  });
  it('recovers free-text unit filters and discards overlong units', () => {
    expect(
      parseIngredientSearchParams(
        new URLSearchParams('unit=+slice+&pageSize=50'),
      ),
    ).toEqual({ page: 1, pageSize: 50, search: '', unit: 'slice' });
    expect(
      parseIngredientSearchParams(new URLSearchParams('unit=12345678901')),
    ).toEqual({ page: 1, pageSize: 10, search: '' });
  });
  it.each([
    undefined,
    null,
    {},
    'https://evil.test/admin/ingredients',
    '//evil.test/admin/ingredients',
    '/admin/nutrients',
    '/admin/ingredients/12',
    '/admin/ingredients#x',
    '/admin/ingredients/../ingredients',
    '/admin/ingredients?next=https://evil.test',
    '/admin/ingredients?page=-1',
    '/admin/ingredients?page=1&page=2',
    '/admin/ingredients?search=rice#x',
    '/admin/%69ngredients',
    '/admin/ingredients\\evil',
  ])('rejects unsafe return-to %j', (value) => {
    expect(getIngredientReturnTo(value)).toBe('/admin/ingredients');
  });
  it('keeps a safe validated list query in return-to', () => {
    expect(
      getIngredientReturnTo(
        '/admin/ingredients?page=3&pageSize=25&search=rice&unit=g',
      ),
    ).toBe('/admin/ingredients?page=3&pageSize=25&search=rice&unit=g');
  });
});
