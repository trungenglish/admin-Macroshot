export const foodsApi = {
  list: async () => Promise.resolve([]),
  get: async (id) => Promise.resolve({ id, name: 'Sample food' }),
};
