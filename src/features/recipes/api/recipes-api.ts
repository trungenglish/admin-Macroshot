import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import axios, { type AxiosRequestConfig } from 'axios';

import { apiClient } from '@/shared/api/api-client';
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

interface RecipeListEnvelope {
  status: string;
  message: string;
  data: {
    items: RecipeDto[];
    meta: { total: number; skip: number; limit: number; count: number };
  };
}

export interface RecipesApiError {
  status?: number;
  message: string;
}

interface QueryArgs {
  url: string;
  method: AxiosRequestConfig['method'];
  params?: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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
  if (
    !isRecord(response) ||
    !isRecord(response.data) ||
    !Array.isArray(response.data.items) ||
    !isRecord(response.data.meta) ||
    typeof response.data.meta.total !== 'number' ||
    typeof response.data.meta.skip !== 'number' ||
    typeof response.data.meta.limit !== 'number'
  ) {
    throw new Error('The recipes API returned an unexpected response.');
  }
  const items = response.data.items as RecipeDto[];
  const meta = response.data.meta as RecipeListEnvelope['data']['meta'];
  const pageSize = meta.limit > 0 ? meta.limit : 10;
  return {
    items: items.map(normalizeRecipe),
    total: meta.total,
    page: Math.floor(meta.skip / pageSize) + 1,
    pageSize,
  };
}

const axiosBaseQuery =
  (): BaseQueryFn<QueryArgs, unknown, RecipesApiError> =>
  async ({ url, method, params }, api) => {
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
  }),
});

export const { useListRecipesQuery } = recipesApi;
