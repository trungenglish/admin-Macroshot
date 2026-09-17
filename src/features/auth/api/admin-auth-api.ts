import axios from 'axios';

import { API_BASE_URL, apiClient } from '@/shared/api/api-client';
import type {
  AdminAuthResult,
  AdminLoginApiResponse,
  AdminSignInCredentials,
  AdminUser,
} from '@/features/auth/auth.types';

export const ADMIN_LOGIN_PATH = '/api/v1/admin/login';
export const GENERIC_ADMIN_SIGN_IN_ERROR =
  'Unable to sign in. Please try again.';

class AdminAuthApiError extends Error {
  readonly userMessage: string;

  constructor(userMessage: string) {
    super(userMessage);
    this.name = 'AdminAuthApiError';
    this.userMessage = userMessage;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readNonEmptyString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function isUsableEmail(value: string) {
  return /^[^\s@]+@[^\s@]+$/.test(value);
}

function normalizeUser(value: unknown): AdminUser | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = value.id;
  const fullName = readNonEmptyString(value.full_name);
  const email = readNonEmptyString(value.email);

  if (
    typeof id !== 'number' ||
    !Number.isInteger(id) ||
    fullName === undefined ||
    email === undefined ||
    !isUsableEmail(email)
  ) {
    return null;
  }

  return {
    id,
    fullName,
    email,
  };
}

function normalizeSuccessResponse(payload: unknown): AdminAuthResult {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new AdminAuthApiError(GENERIC_ADMIN_SIGN_IN_ERROR);
  }

  const apiResponse = payload as unknown as AdminLoginApiResponse;
  const accessToken = apiResponse.data.access_token;
  const user = normalizeUser(apiResponse.data.user);

  if (
    typeof accessToken !== 'string' ||
    accessToken.trim().length === 0 ||
    !user
  ) {
    throw new AdminAuthApiError(GENERIC_ADMIN_SIGN_IN_ERROR);
  }

  return { accessToken, user };
}

function extractServerErrorMessage(payload: unknown) {
  if (!isRecord(payload)) {
    return undefined;
  }

  const message = readNonEmptyString(payload.message);

  if (message) {
    return message;
  }

  const detailMessage = readNonEmptyString(payload.detail);

  if (detailMessage) {
    return detailMessage;
  }

  if (!Array.isArray(payload.detail)) {
    return undefined;
  }

  const validationMessages = payload.detail
    .map((issue) =>
      isRecord(issue) ? readNonEmptyString(issue.msg) : undefined,
    )
    .filter((issue): issue is string => issue !== undefined);

  return validationMessages.length > 0
    ? validationMessages.join(' ')
    : undefined;
}

export function getAdminAuthErrorMessage(error: unknown) {
  if (error instanceof AdminAuthApiError) {
    return error.userMessage;
  }

  if (axios.isAxiosError(error)) {
    return (
      extractServerErrorMessage(error.response?.data) ??
      GENERIC_ADMIN_SIGN_IN_ERROR
    );
  }

  return GENERIC_ADMIN_SIGN_IN_ERROR;
}

export async function authenticateAdmin(
  credentials: AdminSignInCredentials,
): Promise<AdminAuthResult> {
  if (!API_BASE_URL) {
    throw new AdminAuthApiError(GENERIC_ADMIN_SIGN_IN_ERROR);
  }

  try {
    const response = await apiClient.post<unknown>(ADMIN_LOGIN_PATH, {
      username: credentials.username,
      password: credentials.password,
    });

    return normalizeSuccessResponse(response.data);
  } catch (error) {
    throw new AdminAuthApiError(getAdminAuthErrorMessage(error));
  }
}
