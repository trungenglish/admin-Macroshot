import { configureStore, type Action } from '@reduxjs/toolkit';

import authReducer, { loginAdmin } from '@/features/auth/store/auth-slice';
import { nutrientsApi } from '@/features/nutrients/api/nutrients-api';

const REDACTED_PASSWORD = '[REDACTED]';

// Check if value is a record
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// Prevent password from being logged in Redux DevTools
function sanitizeDevToolsAction<A extends Action>(action: A): A {
  const meta = 'meta' in action ? action.meta : undefined;

  if (
    !action.type.startsWith(`${loginAdmin.typePrefix}/`) ||
    !isRecord(meta) ||
    !isRecord(meta.arg) ||
    !('password' in meta.arg)
  ) {
    return action;
  }

  return {
    ...action,
    meta: {
      ...meta,
      arg: {
        ...meta.arg,
        password: REDACTED_PASSWORD,
      },
    },
  } as A;
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [nutrientsApi.reducerPath]: nutrientsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(nutrientsApi.middleware),
  devTools: import.meta.env.DEV
    ? { actionSanitizer: sanitizeDevToolsAction }
    : false,
});

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
