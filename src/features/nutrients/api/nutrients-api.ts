import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import axios, { type AxiosRequestConfig } from 'axios';

import type { RootState } from '@/app/store';
import { apiClient } from '@/shared/api/api-client';
import {
  createPreviewNutrient,
  previewNutrientRequest,
} from './nutrients-preview';
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
  is_active: boolean;
  ingredient_count: number;
}

interface NutrientListDto {
  items: NutrientDto[];
  total: number;
  skip: number;
  limit: number;
  summary?: NutrientSummary;
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

export const isNutrientsPreview =
  import.meta.env.DEV &&
  ['nutrients-preview', 'admin-preview'].includes(import.meta.env.MODE);

function isNutrientUnit(value: unknown): value is NutrientUnit {
  return NUTRIENT_UNITS.includes(value as NutrientUnit);
}

export function normalizeNutrient(dto: NutrientDto): Nutrient {
  if (!isNutrientUnit(dto.unit)) throw new Error('Unsupported nutrient unit');
  return {
    id: dto.id,
    name: dto.name,
    unit: dto.unit,
    isActive: dto.is_active,
    ingredientCount: dto.ingredient_count,
  };
}

export function normalizeNutrientList(
  dto: NutrientListDto,
): NutrientListResult {
  return {
    items: dto.items.map(normalizeNutrient),
    total: dto.total,
    page: Math.floor(dto.skip / dto.limit) + 1,
    pageSize: dto.limit,
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
    const token = (api.getState() as RootState).auth.accessToken;
    try {
      if (isNutrientsPreview) {
        if (url === '/nutrients' && method === 'POST') {
          return {
            data: createPreviewNutrient(
              data as { name: string; unit: NutrientUnit },
            ),
          };
        }
        return previewNutrientRequest({ url, method, data, params });
      }
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
      query: ({ page, pageSize, search, unit, isActive }) => ({
        url: '/nutrients',
        method: 'GET',
        params: {
          skip: (page - 1) * pageSize,
          limit: pageSize,
          ...(search ? { search } : {}),
          ...(unit ? { unit } : {}),
          ...(isActive === undefined ? {} : { is_active: isActive }),
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
      query: (id) => ({ url: `/nutrients/${id}`, method: 'GET' }),
      transformResponse: normalizeNutrient,
      providesTags: (_result, _error, id) => [{ type: 'Nutrient', id }],
    }),
    createNutrient: builder.mutation<Nutrient, NutrientFormValues>({
      query: (body) => ({ url: '/nutrients', method: 'POST', data: body }),
      transformResponse: normalizeNutrient,
      invalidatesTags: [{ type: 'Nutrient', id: 'LIST' }],
    }),
    updateNutrient: builder.mutation<Nutrient, NutrientUpdateInput>({
      query: ({ id, isActive, ...fields }) => ({
        url: `/nutrients/${id}`,
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
      query: (id) => ({ url: `/nutrients/${id}`, method: 'DELETE' }),
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
