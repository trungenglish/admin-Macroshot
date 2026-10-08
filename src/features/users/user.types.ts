export const USER_PAGE_SIZES = [10, 25, 50] as const;

export interface User {
  id: number;
  fullName: string;
  username: string;
  email: string;
  gender: 'male' | 'female' | 'other' | string;
  role: string;
  dateOfBirth: string | null;
  avatarUrl: string | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: string | null;
  desiredWeightKg: number | null;
  goalPaceKgPerWeek: number | null;
  createdAt: string;
  updatedAt: string;
  isNewUser: boolean;
}

export interface UserListQuery {
  page: number;
  pageSize: number;
  search: string;
}

export interface UserListResult {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
}
