import axios from 'axios';

import { appRouter } from '@/app/router';
import { store } from '@/app/store';
import { ingredientsApi } from '@/features/ingredients/api/ingredients-api';
import {
  ADMIN_TOKEN_STORAGE_KEY,
  restoreAdminSession,
} from '@/features/auth/store/auth-slice';
import { nutrientsApi } from '@/features/nutrients/api/nutrients-api';
import { usersApi } from '@/features/users/api/users-api';
import { apiClient } from '@/shared/api/api-client';

let interceptorId: number | null = null;

export function installAuthExpiryInterceptor() {
  if (interceptorId !== null) return;

  interceptorId = apiClient.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401 &&
        store.getState().auth.accessToken
      ) {
        try {
          localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
        } catch {
          // Continue clearing the in-memory session if browser storage is unavailable.
        }

        store.dispatch(restoreAdminSession(null));
        store.dispatch(usersApi.util.resetApiState());
        store.dispatch(ingredientsApi.util.resetApiState());
        store.dispatch(nutrientsApi.util.resetApiState());
        void appRouter.navigate('/login', { replace: true });
      }

      return Promise.reject(error);
    },
  );
}
