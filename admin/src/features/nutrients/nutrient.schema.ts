import { z } from 'zod';

import { NUTRIENT_UNITS } from './nutrient.types';

export const nutrientFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a nutrient name.'),
  unit: z.enum(NUTRIENT_UNITS, { message: 'Choose a supported unit.' }),
});
