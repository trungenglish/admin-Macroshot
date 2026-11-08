import { z } from 'zod';

import { NUTRIENT_UNITS } from '@/features/nutrients/nutrient.types';

const requiredText = (max: number, label: string) =>
  z
    .string()
    .refine(
      (value) => value.trim().length > 0 && value.trim().length <= max,
      `${label} is required and must be at most ${max} characters.`,
    );

const macro = z
  .string()
  .refine(
    (value) =>
      /^\d+$/.test(value.trim()) && Number.isSafeInteger(Number(value.trim())),
    'Enter a non-negative whole number.',
  );

const weight = z
  .string()
  .refine(
    (value) =>
      /^\d{1,5}(\.\d{1,2})?$/.test(value.trim()) && Number(value.trim()) >= 0.1,
    'Enter a weight from 0.1 to 99999.99 grams with up to 2 decimal places.',
  );

const amount = z
  .string()
  .refine(
    (value) => /^\d{1,6}(\.\d{1,4})?$/.test(value.trim()),
    'Enter 0 to 999999.9999 with up to 4 decimal places.',
  );

const nutrientLink = z.object({
  nutrient: z.object({
    id: z
      .number()
      .refine(
        (id) => Number.isSafeInteger(id) && id > 0,
        'Choose a valid nutrient.',
      ),
    name: z.string(),
    unit: z.enum(NUTRIENT_UNITS),
    isActive: z.boolean(),
    ingredientCount: z
      .number()
      .refine((count) => Number.isSafeInteger(count) && count >= 0),
  }),
  amount,
});

export const ingredientFormSchema = z.object({
  name: requiredText(255, 'Name'),
  unit: requiredText(10, 'Unit'),
  defaultWeightPerServing: weight,
  calPer100g: macro,
  proPer100g: macro,
  carbPer100g: macro,
  fatPer100g: macro,
  nutrientLinks: z.array(nutrientLink).superRefine((links, context) => {
    const ids = new Set<number>();
    links.forEach((link, index) => {
      if (ids.has(link.nutrient.id)) {
        context.addIssue({
          code: 'custom',
          path: [index, 'nutrient', 'id'],
          message: 'Choose each nutrient only once.',
        });
      }
      ids.add(link.nutrient.id);
    });
  }),
});
