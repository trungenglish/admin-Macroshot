export interface AdminSignInCredentials {
  username: string;
  password: string;
}

export interface ApiAdminUser {
  id: number;
  full_name: string;
  email: string;
}

export interface AdminLoginApiData {
  access_token: string;
  user: ApiAdminUser;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
}

export interface AdminLoginApiResponse {
  message?: string;
  data: AdminLoginApiData;
}

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
}

export interface AdminAuthResult {
  accessToken: string;
  user: AdminUser;
}

export type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AuthState {
  accessToken: string | null;
  user: AdminUser | null;
  status: AuthStatus;
  error: string | null;
}
