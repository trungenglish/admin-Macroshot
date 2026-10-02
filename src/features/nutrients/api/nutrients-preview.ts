import type { AxiosRequestConfig } from 'axios';

import type { NutrientUnit } from '../nutrient.types';

export interface NutrientPreviewDto {
  id: number;
  name: string;
  unit: NutrientUnit;
  is_active: boolean;
  ingredient_count: number;
}

let nextId = 33;
let nutrients: NutrientPreviewDto[] = [
  ['Protein', 'g', true, 12],
  ['Carbohydrate', 'g', true, 18],
  ['Total fat', 'g', true, 15],
  ['Fiber', 'g', true, 11],
  ['Sugar', 'g', true, 9],
  ['Calcium', 'mg', true, 8],
  ['Iron', 'mg', true, 6],
  ['Magnesium', 'mg', true, 5],
  ['Phosphorus', 'mg', true, 4],
  ['Potassium', 'mg', true, 10],
  ['Sodium', 'mg', true, 14],
  ['Zinc', 'mg', true, 3],
  ['Vitamin A', 'IU', true, 7],
  ['Vitamin C', 'mg', true, 6],
  ['Vitamin D', 'IU', true, 2],
  ['Vitamin E', 'mg', true, 1],
  ['Vitamin K', 'mcg', true, 1],
  ['Thiamin (B1)', 'mg', true, 0],
  ['Riboflavin (B2)', 'mg', true, 0],
  ['Niacin (B3)', 'mg', true, 0],
  ['Pantothenic acid (B5)', 'mg', true, 0],
  ['Vitamin B6', 'mg', true, 0],
  ['Biotin (B7)', 'mcg', false, 0],
  ['Folate (B9)', 'mcg', true, 0],
  ['Vitamin B12', 'mcg', true, 0],
  ['Choline', 'mg', false, 0],
  ['Omega-3', 'g', true, 4],
  ['Omega-6', 'g', true, 4],
  ['Saturated fat', 'g', true, 12],
  ['Trans fat', 'g', false, 0],
  ['Cholesterol', 'mg', true, 8],
  ['Water', 'g', true, 0],
].map(([name, unit, is_active, ingredient_count], index) => ({
  id: index + 1,
  name: name as string,
  unit: unit as NutrientUnit,
  is_active: is_active as boolean,
  ingredient_count: ingredient_count as number,
}));

function response(data: unknown) {
  return { data };
}

function getNutrientSummary() {
  const active = nutrients.reduce(
    (count, nutrient) => count + Number(nutrient.is_active),
    0,
  );

  return {
    total: nutrients.length,
    active,
    inactive: nutrients.length - active,
  };
}

export async function previewNutrientRequest({
  url,
  method,
  data,
  params,
}: {
  url: string;
  method: AxiosRequestConfig['method'];
  data?: unknown;
  params?: Record<string, unknown>;
}) {
  if (url === '/nutrients' && method === 'GET') {
    const search = String(params?.search ?? '').toLowerCase();
    const unit = params?.unit as NutrientUnit | undefined;
    const isActive = params?.is_active as boolean | undefined;
    const filtered = nutrients.filter(
      (nutrient) =>
        (!search || nutrient.name.toLowerCase().includes(search)) &&
        (!unit || nutrient.unit === unit) &&
        (isActive === undefined || nutrient.is_active === isActive),
    );
    const skip = Number(params?.skip ?? 0);
    const limit = Number(params?.limit ?? 10);
    return response({
      items: filtered.slice(skip, skip + limit),
      total: filtered.length,
      skip,
      limit,
      summary: getNutrientSummary(),
    });
  }

  const id = Number(url.split('/').at(-1));
  const nutrient = nutrients.find((item) => item.id === id);
  if (!nutrient) throw new Error('Nutrient not found.');

  if (method === 'GET') return response(nutrient);
  if (method === 'PATCH') {
    const input = data as {
      name?: string;
      unit?: NutrientUnit;
      is_active?: boolean;
    };
    Object.assign(nutrient, input);
    return response(nutrient);
  }
  if (method === 'DELETE') {
    nutrients = nutrients.filter((item) => item.id !== id);
    return response(undefined);
  }
  throw new Error('Unsupported preview request.');
}

export function createPreviewNutrient(input: {
  name: string;
  unit: NutrientUnit;
}) {
  const nutrient: NutrientPreviewDto = {
    id: nextId++,
    name: input.name,
    unit: input.unit,
    is_active: true,
    ingredient_count: 0,
  };
  nutrients = [nutrient, ...nutrients];
  return nutrient;
}
