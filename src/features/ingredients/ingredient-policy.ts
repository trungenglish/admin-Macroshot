import type { Ingredient } from './ingredient.types';

export function isSystemIngredient(
  ingredient: Pick<Ingredient, 'isSystem' | 'userId'>,
): boolean {
  return ingredient.isSystem === true && ingredient.userId === null;
}

export function getIngredientDeletePolicy(
  ingredient: Pick<Ingredient, 'isSystem' | 'userId' | 'recipeCount'>,
): { canDelete: boolean; reason: string | null } {
  if (!isSystemIngredient(ingredient)) {
    return {
      canDelete: false,
      reason: 'Only system ingredients can be deleted.',
    };
  }
  const count = ingredient.recipeCount;
  if (count === null || !Number.isSafeInteger(count) || count < 0) {
    return {
      canDelete: false,
      reason: 'Recipe usage is unavailable. Deletion is disabled.',
    };
  }
  if (count > 0) {
    return {
      canDelete: false,
      reason: 'This ingredient is used by a recipe and cannot be deleted.',
    };
  }
  return { canDelete: true, reason: null };
}
