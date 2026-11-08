import type { Nutrient } from './nutrient.types';

type PolicyInput = Pick<Nutrient, 'isActive' | 'ingredientCount'>;

export function getNutrientActionPolicy(nutrient: PolicyInput) {
  return {
    statusAction: nutrient.isActive
      ? ('deactivate' as const)
      : ('reactivate' as const),
    canDelete: nutrient.ingredientCount === 0,
  };
}
