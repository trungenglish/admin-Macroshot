import { describe, expect, it } from 'vitest';

import { previewNutrientRequest } from './nutrients-preview';

describe('nutrient preview transport', () => {
  it('returns complete overview counts independently from table filters', async () => {
    const response = await previewNutrientRequest({
      url: '/nutrients',
      method: 'GET',
      params: { skip: 0, limit: 10, is_active: false },
    });

    expect(response.data).toMatchObject({
      total: 3,
      summary: { total: 32, active: 29, inactive: 3 },
    });
  });
});
