import { usersApi } from './api';

export const usersService = {
  list: usersApi.list,
  get: usersApi.get,
  save: usersApi.save,
};
