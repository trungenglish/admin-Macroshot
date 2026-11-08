import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import axios, { type AxiosRequestConfig } from 'axios';

import { apiClient } from '@/shared/api/api-client';
import { normalizeContentLanguages } from '@/shared/languages/content-language';
import type { ContentLanguage } from '@/shared/languages/content-language';
import type {
  Recipe,
  RecipeIngredient,
  RecipeListQuery,
  RecipeListResult,
  RecipePortion,
} from '../recipe.types';

interface RecipeDto {
  id: number;
  name: string;
  available_languages?: unknown;
  brand_name: string | null;
  image_url: string | null;
  is_favorite: boolean;
  cal_per_100g: number;
  pro_per_100g: number;
  carb_per_100g: number;
  fat_per_100g: number;
  gram_weight: number;
  is_system: boolean;
  is_verified: boolean;
  user_id: number | null;
  recipe_ingredients: Array<{
    id: number;
    ingredient_id: number;
    name: string;
    quantity: number;
    gram_weight: number;
    image_url: string | null;
    cal_per_100g: number;
    pro_per_100g: number;
    carb_per_100g: number;
    fat_per_100g: number;
  }>;
  portions: Array<{
    unit_name: string;
    gram_weight: number;
    is_default: boolean;
  }>;
}

export interface RecipesApiError {
  status?: number;
  message: string;
}

interface QueryArgs {
  url: string;
  method: AxiosRequestConfig['method'];
  params?: Record<string, unknown>;
  language?: ContentLanguage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isRecipeIngredientDto(
  value: unknown,
): value is RecipeDto['recipe_ingredients'][number] {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.ingredient_id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.quantity === 'number' &&
    typeof value.gram_weight === 'number' &&
    isNullableString(value.image_url) &&
    typeof value.cal_per_100g === 'number' &&
    typeof value.pro_per_100g === 'number' &&
    typeof value.carb_per_100g === 'number' &&
    typeof value.fat_per_100g === 'number'
  );
}

function isRecipeDto(value: unknown): value is RecipeDto {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.name === 'string' &&
    isNullableString(value.brand_name) &&
    isNullableString(value.image_url) &&
    typeof value.is_favorite === 'boolean' &&
    typeof value.cal_per_100g === 'number' &&
    typeof value.pro_per_100g === 'number' &&
    typeof value.carb_per_100g === 'number' &&
    typeof value.fat_per_100g === 'number' &&
    typeof value.gram_weight === 'number' &&
    typeof value.is_system === 'boolean' &&
    typeof value.is_verified === 'boolean' &&
    (typeof value.user_id === 'number' || value.user_id === null) &&
    Array.isArray(value.recipe_ingredients) &&
    value.recipe_ingredients.every(isRecipeIngredientDto) &&
    Array.isArray(value.portions) &&
    value.portions.every(
      (portion) =>
        isRecord(portion) &&
        typeof portion.unit_name === 'string' &&
        typeof portion.gram_weight === 'number' &&
        typeof portion.is_default === 'boolean',
    )
  );
}

function getErrorMessage(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;
  if (typeof payload.message === 'string') return payload.message;
  if (typeof payload.detail === 'string') return payload.detail;
  return undefined;
}

export function normalizeRecipe(dto: RecipeDto): Recipe {
  return {
    id: dto.id,
    name: dto.name,
    availableLanguages: normalizeContentLanguages(dto.available_languages),
    brandName: dto.brand_name,
    imageUrl: dto.image_url,
    isFavorite: dto.is_favorite,
    calPer100g: dto.cal_per_100g,
    proPer100g: dto.pro_per_100g,
    carbPer100g: dto.carb_per_100g,
    fatPer100g: dto.fat_per_100g,
    gramWeight: dto.gram_weight,
    isSystem: dto.is_system,
    isVerified: dto.is_verified,
    userId: dto.user_id,
    ingredients: dto.recipe_ingredients.map(
      (ingredient): RecipeIngredient => ({
        id: ingredient.id,
        ingredientId: ingredient.ingredient_id,
        name: ingredient.name,
        quantity: ingredient.quantity,
        gramWeight: ingredient.gram_weight,
        imageUrl: ingredient.image_url,
        calPer100g: ingredient.cal_per_100g,
        proPer100g: ingredient.pro_per_100g,
        carbPer100g: ingredient.carb_per_100g,
        fatPer100g: ingredient.fat_per_100g,
      }),
    ),
    portions: dto.portions.map(
      (portion): RecipePortion => ({
        unitName: portion.unit_name,
        gramWeight: portion.gram_weight,
        isDefault: portion.is_default,
      }),
    ),
  };
}

export function normalizeRecipeList(response: unknown): RecipeListResult {
  if (!isRecord(response) || !isRecord(response.data)) {
    throw new Error('The recipes API returned an unexpected response.');
  }
  const { items, meta } = response.data;
  if (
    !Array.isArray(items) ||
    !items.every(isRecipeDto) ||
    !isRecord(meta) ||
    typeof meta.total !== 'number' ||
    typeof meta.skip !== 'number' ||
    typeof meta.limit !== 'number'
  ) {
    throw new Error('The recipes API returned an unexpected response.');
  }
  const pageSize = meta.limit > 0 ? meta.limit : 10;
  return {
    items: items.map(normalizeRecipe),
    total: meta.total,
    page: Math.floor(meta.skip / pageSize) + 1,
    pageSize,
  };
}

export function normalizeRecipeDetail(response: unknown): Recipe {
  const dto =
    isRecord(response) && 'data' in response ? response.data : response;
  if (!isRecipeDto(dto)) {
    throw new Error('The recipe API returned an unexpected response.');
  }
  return normalizeRecipe(dto);
}

const axiosBaseQuery =
  (): BaseQueryFn<QueryArgs, unknown, RecipesApiError> =>
  async ({ url, method, params, language }, api) => {
    const token = (api.getState() as { auth: { accessToken: string | null } })
      .auth.accessToken;
    try {
      const response = await apiClient.request({
        url,
        method,
        params,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Accept-Language': 'vi',
          ...(language ? { 'X-Language': language } : {}),
        },
      });
      return { data: response.data };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          error: {
            status: error.response?.status,
            message:
              getErrorMessage(error.response?.data) ??
              'Unable to complete the request. Please try again.',
          },
        };
      }
      return {
        error: {
          message: 'Unable to complete the request. Please try again.',
        },
      };
    }
  };

export const recipesApi = createApi({
  reducerPath: 'recipesApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    listRecipes: builder.query<RecipeListResult, RecipeListQuery>({
      query: ({ page, pageSize, search }) => ({
        url: '/api/v1/recipes/',
        method: 'GET',
        params: {
          skip: (page - 1) * pageSize,
          limit: pageSize,
          ...(search ? { query: search } : {}),
        },
      }),
      transformResponse: normalizeRecipeList,
    }),
    getRecipe: builder.query<Recipe, { id: number; language: ContentLanguage }>(
      {
        query: ({ id, language }) => ({
          url: `/api/v1/recipes/${id}`,
          method: 'GET',
          language,
        }),
        transformResponse: normalizeRecipeDetail,
      },
    ),
  }),
});

export const { useListRecipesQuery, useGetRecipeQuery } = recipesApi;
