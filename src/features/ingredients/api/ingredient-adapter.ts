import { z } from 'zod';

import { NUTRIENT_UNITS } from '@/features/nutrients/nutrient.types';
import type { Ingredient, IngredientNutrientLink } from '../ingredient.types';
import type { IngredientApiError } from './ingredient-transport';

const count = z
  .number()
  .refine((value) => Number.isSafeInteger(value) && value >= 0);
const id = count.refine((value) => value > 0);

// Only the originally supplied Ingredient response fields are mapped here.
// No live HTTP endpoint or complete atomic write contract has been verified.
const ingredientResponseSchema = z.object({
  id,
  name: z.string().min(1).max(255),
  unit: z.string().min(1).max(10),
  user_id: id.nullable(),
  is_system: z.boolean(),
  image_url: z.string().max(500).nullable(),
  default_weight_per_serving: z.unknown(),
  last_input_type: z.string(),
  cal_per_100g: count,
  pro_per_100g: count,
  carb_per_100g: count,
  fat_per_100g: count,
});
const linksSchema = z
  .array(
    z.object({
      nutrient: z.object({
        id,
        name: z.string(),
        unit: z.enum(NUTRIENT_UNITS),
        isActive: z.boolean(),
        ingredientCount: count,
      }),
      amount: z.union([z.string(), z.number()]),
    }),
  )
  .refine(
    (links) =>
      new Set(links.map((link) => link.nutrient.id)).size === links.length,
  );

/** Supplemental domain metadata is a future integration requirement, NOT a
 * claimed backend response envelope. Absence or malformed metadata stays unknown. */
export interface IngredientSupplementalMetadata {
  nutrientLinks?: unknown;
  recipeCount?: unknown;
}

/** Decimal normalization is lexical: no parseFloat, rounding, or Number formatting. */
export function normalizeIngredientDecimal(
  value: unknown,
  kind: 'weight' | 'amount',
): string {
  const raw =
    typeof value === 'number' || typeof value === 'string'
      ? String(value).trim()
      : '';
  const match = /^(\d+)(?:\.(\d+))?$/.exec(raw);
  const whole = match?.[1].replace(/^0+(?=\d)/, '') ?? '';
  const fraction = match?.[2]?.replace(/0+$/, '') ?? '';
  const [digits, scale] = kind === 'weight' ? [5, 2] : [6, 4];
  if (
    !match ||
    whole.length > digits ||
    fraction.length > scale ||
    (kind === 'weight' && whole === '0' && (!fraction || fraction[0] === '0'))
  ) {
    throw new Error(
      'Ingredient decimal is unavailable or would lose precision.',
    );
  }
  return fraction ? `${whole}.${fraction}` : whole;
}

export function normalizeIngredient(
  value: unknown,
  metadata: IngredientSupplementalMetadata = {},
): Ingredient {
  const parsed = ingredientResponseSchema.safeParse(value);
  if (!parsed.success)
    throw new Error('Ingredient response is unavailable or malformed.');
  const dto = parsed.data;
  let nutrientLinks: IngredientNutrientLink[] | null = null;
  const links = linksSchema.safeParse(metadata.nutrientLinks);
  if (links.success) {
    try {
      nutrientLinks = links.data.map((link) => ({
        ...link,
        amount: normalizeIngredientDecimal(link.amount, 'amount'),
      }));
    } catch {
      /* Unavailable decimal metadata must not look like an empty link set. */
    }
  }
  const usage = count.safeParse(metadata.recipeCount);
  return {
    id: dto.id,
    name: dto.name,
    unit: dto.unit,
    userId: dto.user_id,
    isSystem: dto.is_system,
    imageUrl: dto.image_url,
    defaultWeightPerServing: normalizeIngredientDecimal(
      dto.default_weight_per_serving,
      'weight',
    ),
    lastInputType: dto.last_input_type,
    calPer100g: dto.cal_per_100g,
    proPer100g: dto.pro_per_100g,
    carbPer100g: dto.carb_per_100g,
    fatPer100g: dto.fat_per_100g,
    nutrientLinks,
    recipeCount: usage.success ? usage.data : null,
  };
}

const apiErrorSchema = z.object({
  status: z.union([
    z.number().int(),
    z.literal('NOT_CONFIGURED'),
    z.literal('TRANSPORT_ERROR'),
  ]),
  message: z.string(),
  fieldErrors: z
    .object({
      name: z.string().optional(),
      unit: z.string().optional(),
      defaultWeightPerServing: z.string().optional(),
      calPer100g: z.string().optional(),
      proPer100g: z.string().optional(),
      carbPer100g: z.string().optional(),
      fatPer100g: z.string().optional(),
      nutrientLinks: z.string().optional(),
    })
    .optional(),
});

export function normalizeIngredientApiError(
  error: unknown,
): IngredientApiError {
  const parsed = apiErrorSchema.safeParse(error);
  if (parsed.success) return parsed.data;
  return {
    status: 'TRANSPORT_ERROR',
    message:
      error instanceof Error
        ? error.message
        : 'Unable to complete the ingredient request. Please try again.',
  };
}
