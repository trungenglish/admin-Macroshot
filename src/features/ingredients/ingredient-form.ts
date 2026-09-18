import { ingredientFormSchema } from './ingredient.schema';
import type {
  Ingredient,
  IngredientFormValues,
  IngredientSaveInput,
} from './ingredient.types';

export function createIngredientDefaults(): IngredientFormValues {
  return {
    name: '',
    unit: 'g',
    defaultWeightPerServing: '100',
    calPer100g: '',
    proPer100g: '',
    carbPer100g: '',
    fatPer100g: '',
    nutrientLinks: [],
  };
}

export function ingredientToFormValues(
  ingredient: Ingredient,
): IngredientFormValues {
  if (ingredient.nutrientLinks === null) {
    throw new Error('Ingredient nutrient metadata is unavailable.');
  }
  return {
    name: ingredient.name,
    unit: ingredient.unit,
    defaultWeightPerServing: ingredient.defaultWeightPerServing,
    calPer100g: String(ingredient.calPer100g),
    proPer100g: String(ingredient.proPer100g),
    carbPer100g: String(ingredient.carbPer100g),
    fatPer100g: String(ingredient.fatPer100g),
    nutrientLinks: ingredient.nutrientLinks.map((link) => ({
      ...link,
      nutrient: { ...link.nutrient },
    })),
  };
}

export function toIngredientSaveInput(
  values: IngredientFormValues,
): IngredientSaveInput {
  const validated = ingredientFormSchema.parse(values);
  return {
    name: validated.name.trim(),
    unit: validated.unit.trim(),
    defaultWeightPerServing: validated.defaultWeightPerServing.trim(),
    calPer100g: Number(validated.calPer100g.trim()),
    proPer100g: Number(validated.proPer100g.trim()),
    carbPer100g: Number(validated.carbPer100g.trim()),
    fatPer100g: Number(validated.fatPer100g.trim()),
    nutrientLinks: validated.nutrientLinks.map((link) => ({
      nutrient: { ...link.nutrient },
      amount: link.amount.trim(),
    })),
    isSystem: true,
    userId: null,
    inputType: '100g',
  };
}
