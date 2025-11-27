import { foodsApi } from './api';

export const foodsService = {
  list: foodsApi.list,
  get: foodsApi.get,
};
