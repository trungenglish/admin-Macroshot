import { configureStore } from '@reduxjs/toolkit';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { nutrientsApi } from '@/features/nutrients/api/nutrients-api';
import { apiClient } from '@/shared/api/api-client';
import { resetIngredientsPreview } from '../dev/ingredients-preview';
import { nutrientsPreviewAdapter } from '../dev/nutrients-preview-adapter';
import type { Ingredient } from '../ingredient.types';
import { IngredientForm, type IngredientFormProps } from './IngredientForm';

const ingredient: Ingredient = {
  id: 2,
  name: 'Rice',
  unit: 'g',
  userId: null,
  isSystem: true,
  imageUrl: '/rice.png',
  defaultWeightPerServing: '50.25',
  lastInputType: 'serving',
  calPer100g: 120,
  proPer100g: 2,
  carbPer100g: 25,
  fatPer100g: 0,
  recipeCount: 0,
  nutrientLinks: [
    {
      nutrient: {
        id: 13,
        name: 'Legacy fiber',
        unit: 'g',
        isActive: false,
        ingredientCount: 1,
      },
      amount: '1.5000',
    },
  ],
};
const originalAdapter = apiClient.defaults.adapter;
const disposeStores: Array<() => void> = [];
beforeEach(() => {
  resetIngredientsPreview();
  apiClient.defaults.adapter = nutrientsPreviewAdapter;
});
afterEach(() => {
  cleanup();
  disposeStores.forEach((dispose) => dispose());
  disposeStores.length = 0;
  apiClient.defaults.adapter = originalAdapter;
});
function setup(overrides: Partial<IngredientFormProps> = {}) {
  const props = {
    onSubmit: vi.fn(async () => {}),
    onCancel: vi.fn(),
    isPending: false,
    error: null,
    onDirtyChange: vi.fn(),
    ...overrides,
  };
  const store = configureStore({
    reducer: {
      [nutrientsApi.reducerPath]: nutrientsApi.reducer,
      auth: () => ({ accessToken: null }),
    },
    middleware: (getDefault) => getDefault().concat(nutrientsApi.middleware),
  });
  disposeStores.push(() => store.dispatch(nutrientsApi.util.resetApiState()));
  const view = render(
    <Provider store={store}>
      <IngredientForm {...props} />
    </Provider>,
  );
  return { ...view, props, store };
}
async function fillCreate() {
  for (const [label, value] of [
    ['Name', 'Lentils'],
    ['Calories (kcal / 100g)', '120'],
    ['Protein (g / 100g)', '9'],
    ['Carbohydrate (g / 100g)', '20'],
    ['Fat (g / 100g)', '1'],
  ]) {
    await userEvent.type(screen.getByLabelText(label), value);
  }
}
describe('IngredientForm', () => {
  // Break caught: decimal macros are rounded or emitted rather than rejected.
  it('rejects decimal macros and focuses the invalid control', async () => {
    const { props } = setup();
    await fillCreate();
    await userEvent.type(screen.getByLabelText('Calories (kcal / 100g)'), '.5');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create ingredient' }),
    );
    expect(screen.getByLabelText('Calories (kcal / 100g)')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText('Calories (kcal / 100g)')).toHaveFocus();
    expect(props.onSubmit).not.toHaveBeenCalled();
  });
  // Break caught: missing ownership/100g metadata or string macros leak into writes.
  it('emits complete validated create input', async () => {
    const { props } = setup();
    await fillCreate();
    await userEvent.click(
      screen.getByRole('button', { name: 'Create ingredient' }),
    );
    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith({
        name: 'Lentils',
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
      }),
    );
  });
  // Break caught: serving conversion or numeric parsing damages historical amounts.
  it('preserves inactive exact amounts and existing 100g values after name edit', async () => {
    const { props } = setup({ ingredient });
    expect(screen.getByLabelText('Legacy fiber (g / 100g)')).toHaveAttribute(
      'readonly',
    );
    expect(screen.getByRole('img')).toHaveAttribute('src', '/rice.png');
    await userEvent.type(screen.getByLabelText('Name'), ' edited');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Rice edited',
          calPer100g: 120,
          defaultWeightPerServing: '50.25',
          nutrientLinks: ingredient.nutrientLinks,
          inputType: '100g',
        }),
      ),
    );
  });
  // Break caught: inactive links cannot be explicitly removed from complete write input.
  it('removes an inactive link only through its explicit remove action', async () => {
    const { props } = setup({ ingredient });
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Legacy fiber' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ nutrientLinks: [] }),
      ),
    );
  });
  // Break caught: prop refetch/reset replaces the dirty draft.
  it('does not overwrite dirty fields or historical links after a refetch', async () => {
    const { rerender, props, store } = setup({ ingredient });
    await userEvent.type(screen.getByLabelText('Name'), ' draft');
    rerender(
      <Provider store={store}>
        <IngredientForm
          {...props}
          ingredient={{
            ...ingredient,
            name: 'Server refresh',
            nutrientLinks: [],
          }}
        />
      </Provider>,
    );
    expect(screen.getByLabelText('Name')).toHaveValue('Rice draft');
    expect(screen.getByLabelText('Legacy fiber (g / 100g)')).toHaveValue(
      '1.5000',
    );
    expect(props.onDirtyChange).toHaveBeenLastCalledWith(true);
  });
  // Break caught: server field errors are hidden, unfocused, or clear form values.
  it('keeps draft and focuses 422 server field errors', async () => {
    const { props } = setup({
      ingredient,
      onSubmit: vi.fn(async () => {
        throw {
          status: 422,
          message: 'Check fields.',
          fieldErrors: { name: 'Already exists.' },
        };
      }),
    });
    await userEvent.type(screen.getByLabelText('Name'), ' draft');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Already exists.')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Rice draft');
    expect(screen.getByLabelText('Name')).toHaveFocus();
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });
  // Break caught: awaiting submission allows duplicate requests/cancel or drops general errors.
  it('locks pending controls and retains draft on a general failure', async () => {
    let reject!: (reason: unknown) => void;
    const { props } = setup({
      ingredient,
      onSubmit: vi.fn(
        () =>
          new Promise<void>((_, fail) => {
            reject = fail;
          }),
      ),
    });
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByLabelText('Name')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    await act(async () => reject({ status: 403, message: 'Denied.' }));
    expect(await screen.findByText('Denied.')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Rice');
  });
  it('disables save when integration is unconfigured', () => {
    setup({
      ingredient,
      error: {
        status: 'NOT_CONFIGURED',
        message: 'Ingredient API is not configured.',
      },
    });
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ingredient API is not configured.',
    );
  });
  // Break caught: externally supplied mutation field errors are silently dropped.
  it('renders passed-in field errors with focus and linked error ids', async () => {
    setup({
      ingredient,
      error: {
        status: 422,
        message: 'Check fields.',
        fieldErrors: { calPer100g: 'Calories rejected.' },
      },
    });
    expect(await screen.findByText('Calories rejected.')).toBeInTheDocument();
    const control = screen.getByLabelText('Calories (kcal / 100g)');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveFocus();
    expect(
      document.getElementById(control.getAttribute('aria-describedby')!),
    ).toHaveTextContent('Calories rejected.');
  });
  // Break caught: picker selection does not append RHF links or duplicate ids can be selected again.
  it('adds a decimal amount through the real picker and excludes that nutrient on reopening', async () => {
    const { props } = setup({ ingredient });
    await userEvent.click(screen.getByRole('button', { name: 'Add nutrient' }));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Add Iron' }),
    );
    await userEvent.type(screen.getByLabelText('Iron (mg / 100g)'), '0.2500');
    await userEvent.click(screen.getByRole('button', { name: 'Add nutrient' }));
    await screen.findByRole('button', { name: 'Add Calcium' });
    expect(
      screen.queryByRole('button', { name: 'Add Iron' }),
    ).not.toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() =>
      expect(props.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nutrientLinks: [
            ingredient.nutrientLinks![0],
            {
              nutrient: {
                id: 1,
                name: 'Iron',
                unit: 'mg',
                isActive: true,
                ingredientCount: 1,
              },
              amount: '0.2500',
            },
          ],
        }),
      ),
    );
  });
});
