import { z } from 'zod';

import { getNutrientActionPolicy } from '@/features/nutrients/nutrient-policy';
import { nutrientFormSchema } from '@/features/nutrients/nutrient.schema';
import type { Nutrient } from '@/features/nutrients/nutrient.types';
import { normalizeIngredientDecimal } from '../api/ingredient-adapter';
import type {
  IngredientApiError,
  IngredientTransport,
} from '../api/ingredient-transport';
import {
  getIngredientDeletePolicy,
  isSystemIngredient,
} from '../ingredient-policy';
import { ingredientFormSchema } from '../ingredient.schema';
import type { Ingredient, IngredientSaveInput } from '../ingredient.types';

// This module is loaded only by the explicitly enabled development transport.
// All state is in memory; reload or reset restores the original fixture set.
let ingredients: Ingredient[] = [];
let nutrients: Nutrient[] = [];
let nextIngredientId = 102;
let nextNutrientId = 15;

function reject(
  status: number,
  message: string,
  fieldErrors?: IngredientApiError['fieldErrors'],
): never {
  throw {
    status,
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
  } satisfies IngredientApiError;
}

function findIngredient(id: number): Ingredient {
  const ingredient = ingredients.find((item) => item.id === id);
  return ingredient ?? reject(404, 'Ingredient not found.');
}

function findNutrient(id: number): Nutrient {
  const nutrient = nutrients.find((item) => item.id === id);
  return nutrient ?? reject(404, 'Nutrient not found.');
}

function readNutrient(nutrient: Nutrient): Nutrient {
  return {
    ...nutrient,
    ingredientCount: ingredients.filter((item) =>
      item.nutrientLinks?.some((link) => link.nutrient.id === nutrient.id),
    ).length,
  };
}

function readIngredient(ingredient: Ingredient): Ingredient {
  return {
    ...ingredient,
    nutrientLinks:
      ingredient.nutrientLinks?.map((link) => ({
        ...link,
        nutrient: readNutrient(findNutrient(link.nutrient.id)),
      })) ?? null,
  };
}

const macro = z.number().int().nonnegative();
const saveSchema = ingredientFormSchema.extend({
  calPer100g: macro,
  proPer100g: macro,
  carbPer100g: macro,
  fatPer100g: macro,
  isSystem: z.literal(true),
  userId: z.null(),
  inputType: z.literal('100g'),
});

function validateSave(
  input: IngredientSaveInput,
  existing?: Ingredient,
): IngredientSaveInput {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: IngredientApiError['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string' && field in ingredientFormSchema.shape) {
        fieldErrors[field as keyof typeof fieldErrors] ??= issue.message;
      }
    }
    reject(422, 'Check the highlighted fields.', fieldErrors);
  }
  if (existing?.nutrientLinks === null)
    reject(422, 'Ingredient nutrient metadata is unavailable.');
  const data = parsed.data;
  const links = data.nutrientLinks.map((link) => {
    const nutrient = nutrients.find((item) => item.id === link.nutrient.id);
    if (!nutrient)
      reject(422, 'Choose an available nutrient.', {
        nutrientLinks: 'A selected nutrient is unavailable.',
      });
    const amount = normalizeIngredientDecimal(link.amount, 'amount');
    const prior = existing?.nutrientLinks?.find(
      (item) => item.nutrient.id === nutrient.id,
    );
    if (!nutrient.isActive && (!prior || prior.amount !== amount)) {
      reject(422, 'Inactive nutrient links are read-only.', {
        nutrientLinks:
          'Existing inactive links must be preserved unchanged; new inactive links cannot be added.',
      });
    }
    return { nutrient: readNutrient(nutrient), amount };
  });
  for (const prior of existing?.nutrientLinks ?? []) {
    if (
      !findNutrient(prior.nutrient.id).isActive &&
      !links.some((link) => link.nutrient.id === prior.nutrient.id)
    ) {
      reject(422, 'Inactive nutrient links are read-only.', {
        nutrientLinks: 'Existing inactive links must be preserved unchanged.',
      });
    }
  }
  return {
    ...data,
    name: data.name.trim(),
    unit: data.unit.trim(),
    defaultWeightPerServing: normalizeIngredientDecimal(
      data.defaultWeightPerServing,
      'weight',
    ),
    nutrientLinks: links,
  };
}

function applySave(
  id: number,
  input: IngredientSaveInput,
  existing?: Ingredient,
): Ingredient {
  const { inputType, ...values } = input;
  return {
    ...values,
    id,
    imageUrl: existing?.imageUrl ?? null,
    lastInputType: inputType,
    recipeCount: existing ? existing.recipeCount : 0,
  };
}

export const previewIngredientTransport: IngredientTransport = {
  async list({ page, pageSize, search, unit }) {
    const matching = ingredients.filter(
      (item) =>
        isSystemIngredient(item) &&
        item.name.toLowerCase().includes(search.trim().toLowerCase()) &&
        (!unit || item.unit === unit),
    );
    return {
      items: matching
        .slice((page - 1) * pageSize, page * pageSize)
        .map(readIngredient),
      total: matching.length,
      page,
      pageSize,
    };
  },
  async detail(id) {
    return readIngredient(findIngredient(id));
  },
  async create(input) {
    const validated = validateSave(input);
    const created = applySave(nextIngredientId++, validated);
    ingredients.push(created);
    return readIngredient(created);
  },
  async update(id, input) {
    const existing = findIngredient(id);
    if (!isSystemIngredient(existing))
      reject(403, 'Only system ingredients can be updated.');
    const validated = validateSave(input, existing);
    const updated = applySave(id, validated, existing);
    ingredients = ingredients.map((item) => (item.id === id ? updated : item));
    return readIngredient(updated);
  },
  async delete(id) {
    const existing = findIngredient(id);
    const policy = getIngredientDeletePolicy(existing);
    if (!policy.canDelete)
      reject(isSystemIngredient(existing) ? 409 : 403, policy.reason!);
    ingredients = ingredients.filter((item) => item.id !== id);
  },
};

const nutrientPatchSchema = nutrientFormSchema
  .partial()
  .extend({ is_active: z.boolean().optional() });

// Internal bridge used by the verified Nutrients Axios adapter; no injected registry.
export const previewNutrients = {
  list() {
    return nutrients.map(readNutrient);
  },
  detail(id: number) {
    return readNutrient(findNutrient(id));
  },
  create(input: unknown) {
    const parsed = nutrientFormSchema.safeParse(input);
    if (!parsed.success)
      reject(422, 'Enter a nutrient name and supported unit.');
    if (
      nutrients.some(
        (item) => item.name.toLowerCase() === parsed.data.name.toLowerCase(),
      )
    )
      reject(409, 'A nutrient with this name already exists.');
    const created: Nutrient = {
      ...parsed.data,
      id: nextNutrientId++,
      isActive: true,
      ingredientCount: 0,
    };
    nutrients.push(created);
    return readNutrient(created);
  },
  update(id: number, input: unknown) {
    const existing = findNutrient(id);
    const parsed = nutrientPatchSchema.safeParse(input);
    if (!parsed.success) reject(422, 'Enter valid nutrient fields.');
    const { is_active, ...fields } = parsed.data;
    if (
      fields.name &&
      nutrients.some(
        (item) =>
          item.id !== id &&
          item.name.toLowerCase() === fields.name!.toLowerCase(),
      )
    )
      reject(409, 'A nutrient with this name already exists.');
    const updated = {
      ...existing,
      ...fields,
      ...(is_active === undefined ? {} : { isActive: is_active }),
    };
    nutrients = nutrients.map((item) => (item.id === id ? updated : item));
    return readNutrient(updated);
  },
  delete(id: number) {
    const nutrient = readNutrient(findNutrient(id));
    if (!getNutrientActionPolicy(nutrient).canDelete)
      reject(
        409,
        'This nutrient is used by ingredients and cannot be deleted.',
      );
    nutrients = nutrients.filter((item) => item.id !== id);
  },
};

export function resetIngredientsPreview(): void {
  const nutrientNames = [
    'Iron',
    'Calcium',
    'Vitamin C',
    'Vitamin A',
    'Vitamin B12',
    'Sodium',
    'Potassium',
    'Magnesium',
    'Zinc',
    'Folate',
    'Vitamin D',
    'Vitamin E',
    'Legacy fiber',
    'Selenium',
  ];
  nutrients = nutrientNames.map((name, index) => ({
    id: index + 1,
    name,
    unit: index === 12 ? 'g' : 'mg',
    isActive: index !== 12,
    ingredientCount: 0,
  }));
  const ingredientNames = [
    'Tomatoes',
    'Brown rice',
    'Unknown recipe usage',
    'Broccoli',
    'Carrots',
    'Oats',
    'Spinach',
    'Chicken breast',
    'Eggs',
    'Greek yogurt',
    'Bananas',
    'Almonds',
    'Salmon',
    'Olive oil',
  ];
  ingredients = ingredientNames.map((name, index) => ({
    id: index + 1,
    name,
    unit: 'g',
    userId: null,
    isSystem: true,
    imageUrl: null,
    defaultWeightPerServing: '100',
    lastInputType: '100g',
    calPer100g: index === 0 ? 18 : 100,
    proPer100g: 1,
    carbPer100g: 4,
    fatPer100g: 0,
    nutrientLinks:
      index === 0
        ? [{ nutrient: { ...nutrients[0] }, amount: '0.25' }]
        : index === 1
          ? [{ nutrient: { ...nutrients[12] }, amount: '1.5' }]
          : [],
    recipeCount: index === 1 ? 2 : index === 2 ? null : 0,
  }));
  ingredients.push({
    ...ingredients[0],
    id: 101,
    name: 'Personal ingredient',
    isSystem: false,
    userId: 42,
    nutrientLinks: [],
  });
  nextIngredientId = 102;
  nextNutrientId = 15;
}

resetIngredientsPreview();
