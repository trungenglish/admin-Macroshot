import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

import {
  authenticateAdmin,
  GENERIC_ADMIN_SIGN_IN_ERROR,
  getAdminAuthErrorMessage,
} from '@/features/auth/api/admin-auth-api';
import type {
  AdminAuthResult,
  AdminSignInCredentials,
  AuthState,
} from '@/features/auth/auth.types';

export const ADMIN_TOKEN_STORAGE_KEY = 'admin_token';

const initialState = (): AuthState => {
  let accessToken: string | null = null;
  try {
    accessToken = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  } catch {
    // Treat unavailable browser storage as a signed-out session.
  }

  return {
    accessToken,
    user: null,
    status: accessToken ? 'success' : 'idle',
    error: null,
  };
};

type AuthRootState = {
  auth: AuthState;
};

type LoginAdminThunkConfig = {
  state: AuthRootState;
  rejectValue: string;
};

export const loginAdmin = createAsyncThunk<
  AdminAuthResult,
  AdminSignInCredentials,
  LoginAdminThunkConfig
>(
  'auth/loginAdmin',
  async (credentials, { rejectWithValue }) => {
    try {
      const result = await authenticateAdmin(credentials);

      try {
        localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, result.accessToken);
      } catch {
        return rejectWithValue(GENERIC_ADMIN_SIGN_IN_ERROR);
      }

      return result;
    } catch (error) {
      return rejectWithValue(getAdminAuthErrorMessage(error));
    }
  },
  {
    condition: (_, { getState }) => getState().auth.status !== 'loading',
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    restoreAdminSession(state, action: PayloadAction<string | null>) {
      state.accessToken = action.payload;
      state.user = null;
      state.status = action.payload ? 'success' : 'idle';
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;

      if (state.status === 'error') {
        state.status = 'idle';
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.status = 'success';
        state.error = null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload ?? GENERIC_ADMIN_SIGN_IN_ERROR;
      });
  },
});

export const { clearAuthError, restoreAdminSession } = authSlice.actions;

export const selectAuthStatus = (state: AuthRootState) => state.auth.status;
export const selectAuthError = (state: AuthRootState) => state.auth.error;
export const selectAccessToken = (state: AuthRootState) =>
  state.auth.accessToken;
export const selectAdminUser = (state: AuthRootState) => state.auth.user;

export default authSlice.reducer;
