export const NUTRIENT_UNITS = ['g', 'mg', 'mcg', 'IU'] as const;
export const NUTRIENT_PAGE_SIZES = [10, 25, 50] as const;

export type NutrientUnit = (typeof NUTRIENT_UNITS)[number];

export interface Nutrient {
  id: number;
  name: string;
  unit: NutrientUnit;
  isActive: boolean;
  ingredientCount: number;
}

export interface NutrientListQuery {
  page: number;
  pageSize: number;
  search: string;
  unit?: NutrientUnit;
  isActive?: boolean;
}

export interface NutrientListResult {
  items: Nutrient[];
  total: number;
  page: number;
  pageSize: number;
}

export interface NutrientFormValues {
  name: string;
  unit: NutrientUnit;
}

export interface NutrientUpdateInput {
  id: number;
  name?: string;
  unit?: NutrientUnit;
  isActive?: boolean;
}
