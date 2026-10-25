import type { ContentLanguage } from '@/shared/languages/content-language';

export interface RecipeIngredient {
  id: number;
  ingredientId: number;
  name: string;
  quantity: number;
  gramWeight: number;
  imageUrl: string | null;
  calPer100g: number;
  proPer100g: number;
  carbPer100g: number;
  fatPer100g: number;
}

export interface RecipePortion {
  unitName: string;
  gramWeight: number;
  isDefault: boolean;
}

export interface Recipe {
  id: number;
  name: string;
  availableLanguages?: ContentLanguage[];
  brandName: string | null;
  imageUrl: string | null;
  isFavorite: boolean;
  calPer100g: number;
  proPer100g: number;
  carbPer100g: number;
  fatPer100g: number;
  gramWeight: number;
  isSystem: boolean;
  isVerified: boolean;
  userId: number | null;
  ingredients: RecipeIngredient[];
  portions: RecipePortion[];
}

export interface RecipeListQuery {
  page: number;
  pageSize: number;
  search: string;
}

export interface RecipeListResult {
  items: Recipe[];
  total: number;
  page: number;
  pageSize: number;
}
