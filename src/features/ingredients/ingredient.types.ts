import type { Nutrient } from '@/features/nutrients/nutrient.types';

export interface IngredientNutrientLink {
  nutrient: Nutrient;
  amount: string;
}

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  userId: number | null;
  isSystem: boolean;
  imageUrl: string | null;
  defaultWeightPerServing: string;
  lastInputType: string;
  calPer100g: number;
  proPer100g: number;
  carbPer100g: number;
  fatPer100g: number;
  nutrientLinks: IngredientNutrientLink[] | null;
  recipeCount: number | null;
}

export interface IngredientListQuery {
  page: number;
  pageSize: number;
  search: string;
  unit?: string;
}

export interface IngredientSummary {
  total: number;
  inUse: number;
  withNutrientData: number;
  unknownRecipeUsage: number;
}

export interface IngredientListResult {
  items: Ingredient[];
  total: number;
  page: number;
  pageSize: number;
  summary?: IngredientSummary;
}

export interface IngredientFormValues {
  name: string;
  unit: string;
  defaultWeightPerServing: string;
  calPer100g: string;
  proPer100g: string;
  carbPer100g: string;
  fatPer100g: string;
  nutrientLinks: IngredientNutrientLink[];
}

export interface IngredientSaveInput {
  name: string;
  unit: string;
  defaultWeightPerServing: string;
  calPer100g: number;
  proPer100g: number;
  carbPer100g: number;
  fatPer100g: number;
  nutrientLinks: IngredientNutrientLink[];
  isSystem: true;
  userId: null;
  inputType: '100g';
}
