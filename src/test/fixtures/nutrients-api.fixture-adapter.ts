import axios, {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
} from 'axios';

import type { Nutrient } from '@/features/nutrients/nutrient.types';
import { normalizeIngredientApiError } from '@/features/ingredients/api/ingredient-adapter';
import { nutrientFixtures } from '@/test/fixtures/ingredient-transport.fixture';

function toDto(nutrient: Nutrient) {
  return {
    id: nutrient.id,
    name: nutrient.name,
    unit: nutrient.unit,
    is_active: nutrient.isActive,
    ingredient_count: nutrient.ingredientCount,
  };
}

// Simulates Nutrients API requests for isolated tests only.
export const nutrientsApiFixtureAdapter: AxiosAdapter = async (config) => {
  const match = /^(?:\/api\/v1)?\/nutrients\/?(?:([0-9]+))?$/.exec(
    config.url ?? '',
  );
  if (!match) return axios.getAdapter(axios.defaults.adapter)(config);
  const method = config.method?.toUpperCase() ?? 'GET';
  const id = match[1] === undefined ? undefined : Number(match[1]);
  const response = (data: unknown, status = 200): AxiosResponse => ({
    data,
    status,
    statusText: status === 204 ? 'No Content' : 'OK',
    headers: {},
    config,
  });
  try {
    const body: unknown =
      typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    if (method === 'GET' && id === undefined) {
      const params = new URLSearchParams(
        config.params as Record<string, string> | undefined,
      );
      const skip = Math.max(0, Number(params.get('skip') ?? 0));
      const limit = Math.max(1, Number(params.get('limit') ?? 10));
      const search = (params.get('query') ?? params.get('search') ?? '')
        .trim()
        .toLowerCase();
      const unit = params.get('unit');
      const active = params.get('is_active');
      const matching = nutrientFixtures
        .list()
        .filter(
          (item) =>
            item.name.toLowerCase().includes(search) &&
            (!unit || item.unit === unit) &&
            (active === null || item.isActive === (active === 'true')),
        );
      return response({
        items: matching.slice(skip, skip + limit).map(toDto),
        total: matching.length,
        skip,
        limit,
      });
    }
    if (method === 'GET' && id !== undefined)
      return response(toDto(nutrientFixtures.detail(id)));
    if (method === 'POST' && id === undefined)
      return response(toDto(nutrientFixtures.create(body)), 201);
    if (method === 'PATCH' && id !== undefined)
      return response(toDto(nutrientFixtures.update(id, body)));
    if (method === 'DELETE' && id !== undefined) {
      nutrientFixtures.delete(id);
      return response(undefined, 204);
    }
    throw { status: 405, message: 'Unsupported Nutrient fixture operation.' };
  } catch (error) {
    const normalized = normalizeIngredientApiError(error);
    const status =
      typeof normalized.status === 'number' ? normalized.status : 500;
    throw new AxiosError(
      normalized.message,
      'ERR_BAD_RESPONSE',
      config,
      undefined,
      response({ detail: normalized.message }, status),
    );
  }
};
