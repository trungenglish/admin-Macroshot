export const usersApi = {
  list: async () => Promise.resolve([]),
  get: async (id) => Promise.resolve({ id, email: 'demo@nutripal.app' }),
  save: async (payload) => Promise.resolve(payload),
};
