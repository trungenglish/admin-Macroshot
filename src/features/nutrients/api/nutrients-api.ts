import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import axios, { type AxiosRequestConfig } from 'axios';

import { apiClient } from '@/shared/api/api-client';
import {
  NUTRIENT_UNITS,
  type Nutrient,
  type NutrientFormValues,
  type NutrientListQuery,
  type NutrientListResult,
  type NutrientSummary,
  type NutrientUnit,
  type NutrientUpdateInput,
} from '../nutrient.types';

interface NutrientDto {
  id: number;
  name: string;
  unit: NutrientUnit;
  is_active?: boolean;
  ingredient_count?: number;
}

interface NutrientListDto {
  items: NutrientDto[];
  total: number;
  skip: number;
  limit: number;
  summary?: NutrientSummary;
}

interface NutrientListEnvelopeDto {
  success: boolean;
  data: {
    items: NutrientDto[];
    meta: {
      total: number;
      skip: number;
      limit: number;
      count: number;
      total_pages: number;
      current_page: number;
      has_next: boolean;
      has_prev: boolean;
    };
  };
  message: string;
  timestamp: string;
}

export interface ApiError {
  status?: number;
  message: string;
  fieldErrors?: Partial<Record<keyof NutrientFormValues, string>>;
}

interface AxiosBaseQueryArgs {
  url: string;
  method: AxiosRequestConfig['method'];
  data?: unknown;
  params?: Record<string, unknown>;
}

const NUTRIENTS_PATH = '/api/v1/nutrients/';

function isNutrientUnit(value: unknown): value is NutrientUnit {
  return NUTRIENT_UNITS.includes(value as NutrientUnit);
}

export function normalizeNutrient(dto: NutrientDto): Nutrient {
  if (!isNutrientUnit(dto.unit)) throw new Error('Unsupported nutrient unit');
  return {
    id: dto.id,
    name: dto.name,
    unit: dto.unit,
    isActive: dto.is_active ?? true,
    ingredientCount: dto.ingredient_count ?? 0,
  };
}

export function normalizeNutrientList(
  response: NutrientListDto | NutrientListEnvelopeDto,
): NutrientListResult {
  const dto: NutrientListDto =
    'data' in response
      ? {
          items: response.data.items,
          total: response.data.meta.total,
          skip: response.data.meta.skip,
          limit: response.data.meta.limit,
        }
      : response;
  const pageSize = dto.limit > 0 ? dto.limit : Math.max(dto.items.length, 10);

  return {
    items: dto.items.map(normalizeNutrient),
    total: dto.total,
    page: Math.floor(dto.skip / pageSize) + 1,
    pageSize,
    ...(dto.summary ? { summary: dto.summary } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function normalizeApiErrorPayload(
  status: number | undefined,
  payload: unknown,
): ApiError {
  if (!isRecord(payload)) {
    return {
      status,
      message: 'Unable to complete the request. Please try again.',
    };
  }

  const fieldErrors: ApiError['fieldErrors'] = {};
  if (Array.isArray(payload.detail)) {
    for (const issue of payload.detail) {
      if (!isRecord(issue) || !Array.isArray(issue.loc)) continue;
      const field = issue.loc.at(-1);
      if (
        (field === 'name' || field === 'unit') &&
        typeof issue.msg === 'string'
      ) {
        fieldErrors[field as 'name' | 'unit'] = issue.msg;
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status,
      message: 'Check the highlighted fields.',
      fieldErrors,
    };
  }

  return {
    status,
    message:
      (typeof payload.message === 'string' ? payload.message : undefined) ??
      (typeof payload.detail === 'string' ? payload.detail : undefined) ??
      'Unable to complete the request. Please try again.',
  };
}

function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return { message: 'Unable to complete the request. Please try again.' };
  }

  return normalizeApiErrorPayload(error.response?.status, error.response?.data);
}

const axiosBaseQuery =
  (): BaseQueryFn<AxiosBaseQueryArgs, unknown, ApiError> =>
  async ({ url, method, data, params }, api) => {
    const token = (
      api.getState() as { auth: { accessToken: string | null } }
    ).auth.accessToken;
    try {
      const response = await apiClient.request({
        url,
        method,
        data,
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return { data: response.data };
    } catch (error) {
      return { error: toApiError(error) };
    }
  };

export const nutrientsApi = createApi({
  reducerPath: 'nutrientsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Nutrient'],
  endpoints: (builder) => ({
    getNutrients: builder.query<NutrientListResult, NutrientListQuery>({
      query: ({ page, pageSize, search }) => ({
        url: NUTRIENTS_PATH,
        method: 'GET',
        params: {
          skip: (page - 1) * pageSize,
          limit: pageSize,
          ...(search ? { query: search } : {}),
        },
      }),
      transformResponse: normalizeNutrientList,
      providesTags: (result) => [
        { type: 'Nutrient', id: 'LIST' },
        ...(result?.items.map(({ id }) => ({
          type: 'Nutrient' as const,
          id,
        })) ?? []),
      ],
    }),
    getNutrient: builder.query<Nutrient, number>({
      query: (id) => ({ url: `${NUTRIENTS_PATH}${id}`, method: 'GET' }),
      transformResponse: normalizeNutrient,
      providesTags: (_result, _error, id) => [{ type: 'Nutrient', id }],
    }),
    createNutrient: builder.mutation<Nutrient, NutrientFormValues>({
      query: (body) => ({ url: NUTRIENTS_PATH, method: 'POST', data: body }),
      transformResponse: normalizeNutrient,
      invalidatesTags: [{ type: 'Nutrient', id: 'LIST' }],
    }),
    updateNutrient: builder.mutation<Nutrient, NutrientUpdateInput>({
      query: ({ id, isActive, ...fields }) => ({
        url: `${NUTRIENTS_PATH}${id}`,
        method: 'PATCH',
        data: {
          ...fields,
          ...(isActive === undefined ? {} : { is_active: isActive }),
        },
      }),
      transformResponse: normalizeNutrient,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Nutrient', id },
        { type: 'Nutrient', id: 'LIST' },
      ],
    }),
    deleteNutrient: builder.mutation<void, number>({
      query: (id) => ({ url: `${NUTRIENTS_PATH}${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Nutrient', id },
        { type: 'Nutrient', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetNutrientsQuery,
  useGetNutrientQuery,
  useCreateNutrientMutation,
  useUpdateNutrientMutation,
  useDeleteNutrientMutation,
} = nutrientsApi;
