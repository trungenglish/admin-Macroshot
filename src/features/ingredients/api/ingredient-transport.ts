import axios from 'axios';

import { apiClient } from '@/shared/api/api-client';
import { normalizeIngredient } from './ingredient-adapter';
import type {
  Ingredient,
  IngredientFormValues,
  IngredientListQuery,
  IngredientListResult,
  IngredientSaveInput,
} from '../ingredient.types';

const INGREDIENTS_PATH = '/api/v1/ingredients/';

interface IngredientListDto {
  status: string;
  message: string;
  data: {
    items: unknown[];
    meta: {
      total: number;
      skip: number;
      limit: number;
      count: number;
    };
  };
}

export interface IngredientApiError {
  status: number | 'NOT_CONFIGURED' | 'TRANSPORT_ERROR';
  message: string;
  fieldErrors?: Partial<Record<keyof IngredientFormValues, string>>;
}
export interface IngredientTransport {
  list(query: IngredientListQuery): Promise<IngredientListResult>;
  detail(id: number): Promise<Ingredient>;
  create(input: IngredientSaveInput): Promise<Ingredient>;
  update(id: number, input: IngredientSaveInput): Promise<Ingredient>;
  delete(id: number): Promise<void>;
}
function headers(accessToken: string | null) {
  return accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;
}

function normalizeResponse(value: unknown): Ingredient {
  const metadata =
    typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)
      : {};
  return normalizeIngredient(value, {
    nutrientLinks: metadata.nutrient_links,
    recipeCount: metadata.recipe_count,
  });
}

function toWireInput(input: IngredientSaveInput) {
  return {
    name: input.name,
    unit: input.unit,
    default_weight_per_serving: input.defaultWeightPerServing,
    cal_per_100g: input.calPer100g,
    pro_per_100g: input.proPer100g,
    carb_per_100g: input.carbPer100g,
    fat_per_100g: input.fatPer100g,
    nutrient_links: input.nutrientLinks.map((link) => ({
      nutrient_id: link.nutrient.id,
      amount: link.amount,
    })),
    is_system: input.isSystem,
    user_id: input.userId,
    last_input_type: input.inputType,
  };
}

function toTransportError(error: unknown): IngredientApiError {
  if (!axios.isAxiosError(error)) {
    return {
      status: 'TRANSPORT_ERROR',
      message:
        error instanceof Error
          ? error.message
          : 'Unable to complete the ingredient request. Please try again.',
    };
  }
  const payload = error.response?.data;
  const record =
    typeof payload === 'object' && payload !== null
      ? (payload as Record<string, unknown>)
      : {};
  return {
    status: error.response?.status ?? 'TRANSPORT_ERROR',
    message:
      (typeof record.message === 'string' ? record.message : undefined) ??
      (typeof record.detail === 'string' ? record.detail : undefined) ??
      'Unable to complete the ingredient request. Please try again.',
  };
}

export function createHttpIngredientTransport(
  accessToken: string | null,
): IngredientTransport {
  const requestHeaders = headers(accessToken);
  return {
    async list(query) {
      try {
        const response = await apiClient.request<IngredientListDto>({
          url: INGREDIENTS_PATH,
          method: 'GET',
          params: {
            ...(query.search ? { query: query.search } : {}),
            skip: (query.page - 1) * query.pageSize,
            limit: query.pageSize,
          },
          headers: requestHeaders,
        });
        const { items, meta } = response.data.data;
        return {
          items: items.map(normalizeResponse),
          total: meta.total,
          page: Math.floor(meta.skip / meta.limit) + 1,
          pageSize: meta.limit,
        };
      } catch (error) {
        throw toTransportError(error);
      }
    },
    async detail(id) {
      try {
        const response = await apiClient.request({
          url: `${INGREDIENTS_PATH}${id}`,
          method: 'GET',
          headers: requestHeaders,
        });
        return normalizeResponse(response.data);
      } catch (error) {
        throw toTransportError(error);
      }
    },
    async create(input) {
      try {
        const response = await apiClient.request({
          url: INGREDIENTS_PATH,
          method: 'POST',
          data: toWireInput(input),
          headers: requestHeaders,
        });
        return normalizeResponse(response.data);
      } catch (error) {
        throw toTransportError(error);
      }
    },
    async update(id, input) {
      try {
        const response = await apiClient.request({
          url: `${INGREDIENTS_PATH}${id}`,
          method: 'PATCH',
          data: toWireInput(input),
          headers: requestHeaders,
        });
        return normalizeResponse(response.data);
      } catch (error) {
        throw toTransportError(error);
      }
    },
    async delete(id) {
      try {
        await apiClient.request({
          url: `${INGREDIENTS_PATH}${id}`,
          method: 'DELETE',
          headers: requestHeaders,
        });
      } catch (error) {
        throw toTransportError(error);
      }
    },
  };
}

export async function getIngredientTransport(
  accessToken: string | null = null,
): Promise<IngredientTransport> {
  return createHttpIngredientTransport(accessToken);
}
