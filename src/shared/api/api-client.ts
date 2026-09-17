import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() ?? '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
});
