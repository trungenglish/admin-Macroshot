import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { IngredientSaveInput } from '../ingredient.types';
import {
  previewIngredientTransport as preview,
  resetIngredientsPreview,
} from './ingredients-preview';
import { nutrientsPreviewAdapter } from './nutrients-preview-adapter';

const client = axios.create({ adapter: nutrientsPreviewAdapter });
const query = { page: 1, pageSize: 10, search: '' };
const input: IngredientSaveInput = {
  name: 'Test lentils',
  unit: 'g',
  defaultWeightPerServing: '100',
  calPer100g: 120,
  proPer100g: 9,
  carbPer100g: 20,
  fatPer100g: 1,
  nutrientLinks: [],
  isSystem: true,
  userId: null,
  inputType: '100g',
};

beforeEach(resetIngredientsPreview);
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('preview isolation and fixture queries', () => {
  // Break caught: overview cards shrink to the current filter instead of
  // describing the complete system ingredient catalog.
  it('returns complete overview counts independently from table filters', async () => {
    const result = await preview.list({
      page: 1,
      pageSize: 10,
      search: 'Brown',
      unit: 'g',
    });

    expect(result).toMatchObject({
      total: 1,
      summary: {
        total: 14,
        inUse: 1,
        withNutrientData: 2,
        unknownRecipeUsage: 1,
      },
    });
  });

  // Break caught: the shared client enables fixture responses outside the opt-in
  // guard, misses the preview adapter, or intercepts the real login boundary.
  it.each([
    [true, 'development', false],
    [false, 'ingredients-preview', false],
    [true, 'ingredients-preview', true],
  ] as const)(
    'shared Axios DEV=%s MODE=%s uses Nutrient preview=%s and delegates login',
    async (dev, mode, enabled) => {
      vi.stubEnv('DEV', dev);
      vi.stubEnv('MODE', mode);
      vi.resetModules();
      const runtimeAxios = (await import('axios')).default;
      const original = runtimeAxios.defaults.adapter;
      runtimeAxios.defaults.adapter = async (config) => ({
        data: { source: 'original adapter' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
      try {
        const { apiClient } = await import('@/shared/api/api-client');
        const result = await apiClient.get('/nutrients', {
          params: { search: 'Iron', skip: 0, limit: 10 },
        });
        if (enabled) {
          expect(
            result.data.items.map((item: { name: string }) => item.name),
          ).toEqual(['Iron']);
        } else {
          expect(result.data).toEqual({ source: 'original adapter' });
        }
        const login = await apiClient.post('/api/v1/admin/login', {
          username: 'preview-test',
          password: 'not-a-real-password',
        });
        expect(login.data).toEqual({ source: 'original adapter' });
      } finally {
        runtimeAxios.defaults.adapter = original;
      }
    },
  );

  // Break caught: preview enabling outside an explicit development mode.
  it.each([
    [true, 'development', false],
    [false, 'ingredients-preview', false],
    [true, 'ingredients-preview', true],
  ] as const)(
    'DEV=%s MODE=%s enables preview=%s',
    async (dev, mode, enabled) => {
      vi.stubEnv('DEV', dev);
      vi.stubEnv('MODE', mode);
      vi.resetModules();
      const transport = await import('../api/ingredient-transport');
      expect(transport.isIngredientsPreview).toBe(enabled);
      const port = await transport.getIngredientTransport();
      if (enabled) expect((await port.list(query)).items.length).toBe(10);
      else {
        for (const operation of [
          () => port.list(query),
          () => port.detail(1),
          () => port.create(input),
          () => port.update(1, input),
          () => port.delete(1),
        ]) {
          await expect(operation()).rejects.toEqual({
            status: 'NOT_CONFIGURED',
            message:
              'Ingredient API is not configured. Use the development preview or connect a verified backend transport.',
          });
        }
      }
    },
  );

  // Break caught: personal rows leak into lists or paging/filtering is ignored.
  it('lists only system records with paging, search and unit filters', async () => {
    const first = await preview.list(query);
    const second = await preview.list({ ...query, page: 2 });
    expect(first.items).toHaveLength(10);
    expect(first.total).toBeGreaterThan(10);
    expect(second.items.length).toBeGreaterThan(0);
    expect(
      first.items.some((item) =>
        second.items.some((other) => other.id === item.id),
      ),
    ).toBe(false);
    expect(
      [...first.items, ...second.items].every(
        (item) => item.isSystem && item.userId === null,
      ),
    ).toBe(true);
    expect(
      (await preview.list({ ...query, search: 'TOMATO', unit: 'g' })).items.map(
        (item) => item.name,
      ),
    ).toEqual(['Tomatoes']);
    expect(
      (await preview.list({ ...query, search: 'tomato', unit: 'cup' })).items,
    ).toEqual([]);
    expect((await preview.detail(101)).userId).toBe(42);
    await expect(preview.detail(99999)).rejects.toMatchObject({ status: 404 });
  });

  // Break caught: fixtures persist between sessions or expose mutable references.
  it('resets changes and returns detached records', async () => {
    const created = await preview.create(input);
    created.name = 'Outside mutation';
    expect((await preview.detail(created.id)).name).toBe('Test lentils');
    resetIngredientsPreview();
    await expect(preview.detail(created.id)).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe('preview ingredient policies and atomic saves', () => {
  // Break caught: writes skip the authoritative ownership check.
  it('denies personal ingredient update/delete and forged create ownership', async () => {
    await expect(preview.update(101, input)).rejects.toMatchObject({
      status: 403,
    });
    await expect(preview.delete(101)).rejects.toMatchObject({ status: 403 });
    await expect(
      preview.create({
        ...input,
        userId: 42,
      } as unknown as IngredientSaveInput),
    ).rejects.toMatchObject({ status: 422 });
  });

  // Break caught: recipe usage absent is interpreted as zero or used rows delete.
  it('denies used and unknown-usage deletion without removing either record', async () => {
    await expect(preview.delete(2)).rejects.toEqual({
      status: 409,
      message: 'This ingredient is used by a recipe and cannot be deleted.',
    });
    await expect(preview.delete(3)).rejects.toMatchObject({
      status: 409,
      message: 'Recipe usage is unavailable. Deletion is disabled.',
    });
    expect((await preview.detail(2)).recipeCount).toBeGreaterThan(0);
    expect((await preview.detail(3)).recipeCount).toBeNull();
  });

  // Break caught: validating links after mutating the base row leaves partial changes.
  it('rolls back base and links when any link is invalid', async () => {
    const before = await preview.detail(1);
    const nutrient = before.nutrientLinks![0].nutrient;
    await expect(
      preview.update(1, {
        ...input,
        name: 'Should not save',
        nutrientLinks: [{ nutrient, amount: '0.12345' }],
      }),
    ).rejects.toMatchObject({ status: 422 });
    expect(await preview.detail(1)).toEqual(before);
    const countBefore = (await preview.list({ ...query, pageSize: 50 })).total;
    await expect(
      preview.create({
        ...input,
        nutrientLinks: [{ nutrient: { ...nutrient, id: 99999 }, amount: '1' }],
      }),
    ).rejects.toMatchObject({ status: 422 });
    expect((await preview.list({ ...query, pageSize: 50 })).total).toBe(
      countBefore,
    );
  });

  // Break caught: an existing inactive link cannot be deliberately removed on save.
  it('allows saving without a historical inactive link and removes its usage', async () => {
    const before = await preview.detail(2);
    expect(before.nutrientLinks).toEqual([
      expect.objectContaining({
        nutrient: expect.objectContaining({ id: 13, isActive: false }),
      }),
    ]);
    await expect(
      preview.update(2, { ...input, nutrientLinks: [] }),
    ).resolves.toMatchObject({ id: 2, nutrientLinks: [] });
    expect((await preview.detail(2)).nutrientLinks).toEqual([]);
    expect((await client.get('/nutrients/13')).data.ingredient_count).toBe(0);
  });

  // Break caught: retained inactive links are edited or newly added via forged active metadata.
  it('preserves retained inactive links read-only and rejects new inactive links', async () => {
    const before = await preview.detail(2);
    const inactive = before.nutrientLinks!.find(
      (link) => !link.nutrient.isActive,
    )!;
    expect(inactive).toBeDefined();
    const updated = await preview.update(2, {
      ...input,
      nutrientLinks: before.nutrientLinks!,
    });
    expect(updated.nutrientLinks).toContainEqual(inactive);
    await expect(
      preview.update(2, {
        ...input,
        nutrientLinks: [{ ...inactive, amount: '99' }],
      }),
    ).rejects.toMatchObject({ status: 422 });
    await expect(
      preview.create({
        ...input,
        nutrientLinks: [
          { ...inactive, nutrient: { ...inactive.nutrient, isActive: true } },
        ],
      }),
    ).rejects.toMatchObject({ status: 422 });
    expect((await preview.detail(2)).nutrientLinks).toEqual(
      updated.nutrientLinks,
    );
  });
});

describe('verified Nutrients preview contract', () => {
  // Break caught: picker pagination or inactive filtering uses a disconnected fixture.
  it('supports Nutrient search/unit/status and skip/limit', async () => {
    const active = await client.get('/nutrients', {
      params: { is_active: true, skip: 0, limit: 10 },
    });
    expect(active.data.items).toHaveLength(10);
    expect(active.data.total).toBeGreaterThan(10);
    expect(
      active.data.items.every((item: { is_active: boolean }) => item.is_active),
    ).toBe(true);
    const next = await client.get('/nutrients', {
      params: { is_active: true, skip: 10, limit: 10 },
    });
    expect(next.data.items.length).toBeGreaterThan(0);
    expect(next.data.skip).toBe(10);
    const filtered = await client.get('/nutrients', {
      params: {
        search: 'IRON',
        unit: 'mg',
        is_active: true,
        skip: 0,
        limit: 10,
      },
    });
    expect(
      filtered.data.items.map((item: { name: string }) => item.name),
    ).toEqual(['Iron']);
    const inactive = await client.get('/nutrients', {
      params: { is_active: false, skip: 0, limit: 10 },
    });
    expect(inactive.data.items.length).toBeGreaterThan(0);
    expect(
      inactive.data.items.every(
        (item: { is_active: boolean }) => !item.is_active,
      ),
    ).toBe(true);
  });

  // Break caught: nutrient counts are stale, or linked nutrients can be deleted.
  it('shares link counts across Ingredient writes and Nutrient CRUD', async () => {
    const { data: nutrient } = await client.post('/nutrients', {
      name: 'Preview selenium',
      unit: 'mcg',
    });
    const link = {
      nutrient: {
        id: nutrient.id,
        name: nutrient.name,
        unit: 'mcg' as const,
        isActive: true,
        ingredientCount: 0,
      },
      amount: '0.1234',
    };
    const created = await preview.create({ ...input, nutrientLinks: [link] });
    expect(
      (await client.get(`/nutrients/${nutrient.id}`)).data.ingredient_count,
    ).toBe(1);
    await expect(
      client.delete(`/nutrients/${nutrient.id}`),
    ).rejects.toMatchObject({ response: { status: 409 } });
    await client.patch(`/nutrients/${nutrient.id}`, {
      name: 'Renamed selenium',
      is_active: false,
    });
    expect(
      (await preview.detail(created.id)).nutrientLinks![0].nutrient,
    ).toMatchObject({
      name: 'Renamed selenium',
      isActive: false,
      ingredientCount: 1,
    });
    await preview.delete(created.id);
    expect(
      (await client.get(`/nutrients/${nutrient.id}`)).data.ingredient_count,
    ).toBe(0);
    expect((await client.delete(`/nutrients/${nutrient.id}`)).status).toBe(204);
    await expect(client.get(`/nutrients/${nutrient.id}`)).rejects.toMatchObject(
      { response: { status: 404 } },
    );
  });

  // Break caught: preview fabricates authentication or captures unrelated requests.
  it('delegates unrelated URLs to the original Axios adapter', async () => {
    const original = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => ({
      data: { detail: 'Real boundary' },
      status: 418,
      statusText: 'Boundary',
      headers: {},
      config,
    });
    try {
      const result = await client.post('/api/v1/admin/login', {
        username: 'x',
        password: 'x',
      });
      expect(result.data).toEqual({ detail: 'Real boundary' });
      expect(result.status).toBe(418);
    } finally {
      axios.defaults.adapter = original;
    }
  });
});
