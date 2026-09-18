import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() ?? '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
});

if (import.meta.env.DEV && import.meta.env.MODE === 'ingredients-preview') {
  const originalAdapter = apiClient.defaults.adapter;
  apiClient.defaults.adapter = async (config) => {
    if (!/^\/nutrients(?:\/\d+)?$/.test(config.url ?? '')) {
      return axios.getAdapter(originalAdapter)(config);
    }
    const { nutrientsPreviewAdapter } =
      await import('@/features/ingredients/dev/nutrients-preview-adapter');
    return nutrientsPreviewAdapter(config);
  };
}
