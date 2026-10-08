import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import axios, { type AxiosRequestConfig } from 'axios';

import { apiClient } from '@/shared/api/api-client';
import type { User, UserListQuery, UserListResult } from '../user.types';

export interface UserDto {
  id: number;
  full_name: string;
  username: string;
  email: string;
  gender: string;
  role: string;
  date_of_birth: string | null;
  avatar_url: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: string | null;
  desired_weight_kg: number | null;
  goal_pace_kg_per_week: number | null;
  created_at: string;
  updated_at: string;
  is_new_user: boolean;
}

interface UserListEnvelope {
  success: boolean;
  data: {
    items: UserDto[];
    meta: {
      total: number;
      skip: number;
      limit: number;
      count: number;
      total_pages?: number;
      current_page?: number;
      has_next?: boolean;
      has_prev?: boolean;
    };
  };
  message: string;
  timestamp: string;
}

export interface UsersApiError {
  status?: number;
  message: string;
}

interface QueryArgs {
  url: string;
  method: AxiosRequestConfig['method'];
  params?: Record<string, unknown>;
}

export function normalizeUser(dto: UserDto): User {
  return {
    id: dto.id,
    fullName: dto.full_name,
    username: dto.username,
    email: dto.email,
    gender: dto.gender,
    role: dto.role,
    dateOfBirth: dto.date_of_birth,
    avatarUrl: dto.avatar_url,
    heightCm: dto.height_cm,
    weightKg: dto.weight_kg,
    activityLevel: dto.activity_level,
    desiredWeightKg: dto.desired_weight_kg,
    goalPaceKgPerWeek: dto.goal_pace_kg_per_week,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    isNewUser: dto.is_new_user,
  };
}

export function normalizeUserList(response: UserListEnvelope): UserListResult {
  const { items, meta } = response.data;
  const pageSize = meta.limit > 0 ? meta.limit : Math.max(items.length, 10);
  return {
    items: items.map(normalizeUser),
    total: meta.total,
    page: Math.floor(meta.skip / pageSize) + 1,
    pageSize,
  };
}

const axiosBaseQuery =
  (): BaseQueryFn<QueryArgs, unknown, UsersApiError> =>
  async ({ url, method, params }, api) => {
    const token = (
      api.getState() as { auth: { accessToken: string | null } }
    ).auth.accessToken;
    try {
      const response = await apiClient.request({
        url,
        method,
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return { data: response.data };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const payload = error.response?.data as
          | { message?: string; detail?: string }
          | undefined;
        return {
          error: {
            status: error.response?.status,
            message:
              payload?.message ?? payload?.detail ?? 'Unable to load users.',
          },
        };
      }
      return { error: { message: 'Unable to load users.' } };
    }
  };

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    getUsers: builder.query<UserListResult, UserListQuery>({
      query: ({ page, pageSize, search }) => ({
        url: '/api/v1/users/',
        method: 'GET',
        params: {
          skip: (page - 1) * pageSize,
          limit: pageSize,
          ...(search ? { query: search } : {}),
        },
      }),
      transformResponse: normalizeUserList,
    }),
  }),
});

export const { useGetUsersQuery } = usersApi;
