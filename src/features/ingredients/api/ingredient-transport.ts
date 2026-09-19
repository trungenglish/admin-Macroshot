import type {
  Ingredient,
  IngredientFormValues,
  IngredientListQuery,
  IngredientListResult,
  IngredientSaveInput,
} from '../ingredient.types';

export interface IngredientApiError {
  status: number | 'NOT_CONFIGURED' | 'TRANSPORT_ERROR';
  message: string;
  fieldErrors?: Partial<Record<keyof IngredientFormValues, string>>;
}
export interface IngredientTransport {
  list(query: IngredientListQuery): Promise<IngredientListResult>;
  detail(id: number): Promise<Ingredient>;
  create(input: IngredientSaveInput): Promise<Ingredient>;
  update(id: number, input: IngredientSaveInput): Promise<Ingredient>;
  delete(id: number): Promise<void>;
}
export const isIngredientsPreview: boolean =
  import.meta.env.DEV &&
  ['ingredients-preview', 'admin-preview'].includes(import.meta.env.MODE);

async function notConfigured(): Promise<never> {
  throw {
    status: 'NOT_CONFIGURED',
    message:
      'Ingredient API is not configured. Use the development preview or connect a verified backend transport.',
  } satisfies IngredientApiError;
}

const unconfiguredTransport: IngredientTransport = {
  list: notConfigured,
  detail: notConfigured,
  create: notConfigured,
  update: notConfigured,
  delete: notConfigured,
};

export async function getIngredientTransport(): Promise<IngredientTransport> {
  if (isIngredientsPreview) {
    const { previewIngredientTransport } =
      await import('../dev/ingredients-preview');
    return previewIngredientTransport;
  }
  return unconfiguredTransport;
}
