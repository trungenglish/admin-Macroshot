import { authApi } from './api';

export const authService = {
  login: authApi.login,
  logout: authApi.logout,
  refresh: authApi.refresh,
};
