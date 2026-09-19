import { configureStore } from '@reduxjs/toolkit';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nutrientsApi } from '@/features/nutrients/api/nutrients-api';
import { ingredientsApi } from '../api/ingredients-api';
import {
  previewIngredientTransport as preview,
  resetIngredientsPreview,
} from '../dev/ingredients-preview';
import type { Ingredient } from '../ingredient.types';
import { DeleteIngredientDialog } from './DeleteIngredientDialog';

const runtime = vi.hoisted(() => ({ success: vi.fn() }));
vi.mock('../api/ingredient-transport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/ingredient-transport')>()),
  isIngredientsPreview: true,
  getIngredientTransport: async () =>
    (await import('../dev/ingredients-preview')).previewIngredientTransport,
}));
vi.mock('sonner', () => ({ toast: { success: runtime.success } }));
const disposers: Array<() => void> = [];
function setup(ingredient: Ingredient, onClose = vi.fn()) {
  const store = configureStore({
    reducer: {
      [ingredientsApi.reducerPath]: ingredientsApi.reducer,
      [nutrientsApi.reducerPath]: nutrientsApi.reducer,
    },
    middleware: (getDefault) =>
      getDefault().concat(ingredientsApi.middleware, nutrientsApi.middleware),
  });
  const element = (record: Ingredient) => (
    <Provider store={store}>
      <DeleteIngredientDialog
        ingredient={record}
        onClose={onClose}
      />
    </Provider>
  );
  const view = render(element(ingredient));
  disposers.push(() => store.dispatch(ingredientsApi.util.resetApiState()));
  return {
    onClose,
    rerender: (record: Ingredient) => view.rerender(element(record)),
  };
}
beforeEach(() => {
  resetIngredientsPreview();
  runtime.success.mockClear();
});
afterEach(() => {
  cleanup();
  disposers.splice(0).forEach((dispose) => dispose());
  vi.restoreAllMocks();
});
describe('DeleteIngredientDialog', () => {
  // Break caught: deletion uses stale list usage instead of refreshed detail at confirmation.
  it.each([null, 1])(
    'rechecks usage %s before deleting',
    async (recipeCount) => {
      const ingredient = await preview.detail(1);
      const detail = vi
        .spyOn(preview, 'detail')
        .mockResolvedValueOnce(ingredient)
        .mockResolvedValue({ ...ingredient, recipeCount });
      const remove = vi.spyOn(preview, 'delete');
      setup(ingredient);
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Delete permanently' }),
        ).toBeEnabled(),
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Delete permanently' }),
      );
      expect(
        await screen.findByText(
          recipeCount === null
            ? 'Recipe usage is unavailable. Deletion is disabled.'
            : 'This ingredient is used by a recipe and cannot be deleted.',
        ),
      ).toBeVisible();
      expect(detail).toHaveBeenCalledTimes(2);
      expect(remove).not.toHaveBeenCalled();
      expect(screen.getByRole('alertdialog')).toBeVisible();
    },
  );
  it('uses latest ownership and usage props while a confirmation refresh is pending', async () => {
    const ingredient = await preview.detail(1);
    let finish!: (record: Ingredient) => void;
    vi.spyOn(preview, 'detail')
      .mockResolvedValueOnce(ingredient)
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
    const remove = vi.spyOn(preview, 'delete');
    const view = setup(ingredient);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Delete permanently' }),
      ).toBeEnabled(),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete permanently' }),
    );
    view.rerender({ ...ingredient, isSystem: false, userId: 42 });
    await act(async () => finish(ingredient));
    expect(
      await screen.findByText('Only system ingredients can be deleted.'),
    ).toBeVisible();
    expect(remove).not.toHaveBeenCalled();
    expect(view.onClose).not.toHaveBeenCalled();
  });
  it('locks cancellation, escape and double confirmation until delete fulfills', async () => {
    const ingredient = await preview.detail(1);
    let finish!: () => void;
    const remove = vi.spyOn(preview, 'delete').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const view = setup(ingredient);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Delete permanently' }),
      ).toBeEnabled(),
    );
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName(
      'Delete Tomatoes permanently?',
    );
    await userEvent.dblClick(
      screen.getByRole('button', { name: 'Delete permanently' }),
    );
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Delete permanently' }),
    ).toBeDisabled();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(
      document.querySelector('[data-slot="alert-dialog-overlay"]')!,
    );
    expect(view.onClose).not.toHaveBeenCalled();
    expect(runtime.success).not.toHaveBeenCalled();
    await act(async () => finish());
    await waitFor(() => expect(view.onClose).toHaveBeenCalledTimes(1));
    expect(runtime.success).toHaveBeenCalledWith('Ingredient deleted.');
  });
  it.each([409, 500])(
    'retains rejected %s confirmation and supports retry',
    async (status) => {
      const ingredient = await preview.detail(1);
      const remove = vi
        .spyOn(preview, 'delete')
        .mockRejectedValueOnce({ status, message: 'Request failed.' })
        .mockResolvedValue(undefined);
      const view = setup(ingredient);
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Delete permanently' }),
        ).toBeEnabled(),
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Delete permanently' }),
      );
      expect(
        await screen.findByText(
          status === 409
            ? 'This ingredient is used by a recipe and cannot be deleted.'
            : 'Request failed.',
        ),
      ).toBeVisible();
      expect(screen.getByRole('alertdialog')).toBeVisible();
      expect(runtime.success).not.toHaveBeenCalled();
      expect(view.onClose).not.toHaveBeenCalled();
      await userEvent.click(
        screen.getByRole('button', { name: 'Delete permanently' }),
      );
      await waitFor(() => expect(view.onClose).toHaveBeenCalledTimes(1));
      expect(remove).toHaveBeenCalledTimes(2);
    },
  );
  it('refuses delete when the final refresh fails', async () => {
    const ingredient = await preview.detail(1);
    vi.spyOn(preview, 'detail')
      .mockResolvedValueOnce(ingredient)
      .mockRejectedValue({ status: 500, message: 'Refresh failed.' });
    const remove = vi.spyOn(preview, 'delete');
    setup(ingredient);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Delete permanently' }),
      ).toBeEnabled(),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete permanently' }),
    );
    expect(await screen.findByText('Refresh failed.')).toBeVisible();
    expect(remove).not.toHaveBeenCalled();
  });
  it.each([null, 2])(
    'fails closed when detail usage is %s at open despite a safe list row',
    async (recipeCount) => {
      const ingredient = await preview.detail(1);
      vi.spyOn(preview, 'detail').mockResolvedValue({
        ...ingredient,
        recipeCount,
      });
      const remove = vi.spyOn(preview, 'delete');
      setup(ingredient);
      expect(
        await screen.findByText(
          recipeCount === null
            ? 'Recipe usage is unavailable. Deletion is disabled.'
            : 'This ingredient is used by a recipe and cannot be deleted.',
        ),
      ).toBeVisible();
      expect(
        screen.getByRole('button', { name: 'Delete permanently' }),
      ).toBeDisabled();
      expect(remove).not.toHaveBeenCalled();
    },
  );
  it('requires a second confirmation for a newly renamed ingredient', async () => {
    const ingredient = await preview.detail(1);
    vi.spyOn(preview, 'detail')
      .mockResolvedValueOnce(ingredient)
      .mockResolvedValue({ ...ingredient, name: 'Renamed tomatoes' });
    const remove = vi.spyOn(preview, 'delete').mockResolvedValue(undefined);
    const view = setup(ingredient);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Delete permanently' }),
      ).toBeEnabled(),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete permanently' }),
    );
    expect(
      await screen.findByText(
        'Ingredient details changed. Review the updated name before confirming deletion.',
      ),
    ).toBeVisible();
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName(
      'Delete Renamed tomatoes permanently?',
    );
    expect(remove).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete permanently' }),
    );
    await waitFor(() => expect(view.onClose).toHaveBeenCalledTimes(1));
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
