import { configureStore } from '@reduxjs/toolkit';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';

import authReducer from '@/features/auth/store/auth-slice';
import { apiClient } from '@/shared/api/api-client';
import { nutrientsApi } from '../api/nutrients-api';
import type { Nutrient } from '../nutrient.types';
import { DeleteNutrientDialog } from './DeleteNutrientDialog';
import { NutrientDetailsDialog } from './NutrientDetailsDialog';
import { NutrientRowActions } from './NutrientRowActions';
import { NutrientStatusDialog } from './NutrientStatusDialog';

const iron: Nutrient = {
  id: 1,
  name: 'Iron',
  unit: 'mg',
  isActive: true,
  ingredientCount: 4,
};
const zinc: Nutrient = {
  id: 2,
  name: 'Zinc',
  unit: 'mg',
  isActive: true,
  ingredientCount: 0,
};
const callbacks = () => ({
  onView: vi.fn(),
  onEdit: vi.fn(),
  onToggleStatus: vi.fn(),
  onDelete: vi.fn(),
});

afterEach(() => vi.restoreAllMocks());

describe('NutrientRowActions', () => {
  it('offers deactivate but safely disables delete for a used active nutrient', async () => {
    const actions = callbacks();
    render(
      <NutrientRowActions
        nutrient={iron}
        {...actions}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Actions for Iron' }),
    );
    expect(
      screen.getByRole('menuitem', { name: 'Deactivate' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
    const deleteItem = screen.getByRole('menuitem', { name: 'Delete' });
    expect(deleteItem).toHaveAttribute('aria-disabled', 'true');
    expect(deleteItem).toHaveAttribute('data-variant', 'default');
    expect(
      screen.getByText('Used by 4 ingredients. Deactivate it instead.'),
    ).toBeInTheDocument();
    fireEvent.click(deleteItem);
    expect(actions.onDelete).not.toHaveBeenCalled();
  });

  it.each([
    ['View details', 'onView'],
    ['Edit', 'onEdit'],
    ['Deactivate', 'onToggleStatus'],
    ['Delete', 'onDelete'],
  ] as const)(
    'routes %s to the selected unused nutrient',
    async (name, callback) => {
      const actions = callbacks();
      render(
        <NutrientRowActions
          nutrient={zinc}
          {...actions}
        />,
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Actions for Zinc' }),
      );
      await userEvent.click(screen.getByRole('menuitem', { name }));
      expect(actions[callback]).toHaveBeenCalledWith(zinc);
    },
  );

  it('offers reactivate for an inactive used nutrient', async () => {
    const nutrient = { ...iron, isActive: false };
    const actions = callbacks();
    render(
      <NutrientRowActions
        nutrient={nutrient}
        {...actions}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Actions for Iron' }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Reactivate' }));
    expect(actions.onToggleStatus).toHaveBeenCalledWith(nutrient);
  });
});

describe('nutrient confirmation dialogs', () => {
  it('never offers permanent deletion when a parent selects a used nutrient', () => {
    render(
      <DeleteNutrientDialog
        nutrient={iron}
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it.each([
    [NutrientStatusDialog, iron, 'Deactivate'],
    [DeleteNutrientDialog, zinc, 'Delete permanently'],
  ])(
    'requires explicit confirmation and locks pending dismissal (%s)',
    async (Component, nutrient, name) => {
      let resolve: (() => void) | undefined;
      const onConfirm = vi.fn(
        () =>
          new Promise<void>((done) => {
            resolve = done;
          }),
      );
      const onOpenChange = vi.fn();
      render(
        <Component
          nutrient={nutrient}
          open
          onOpenChange={onOpenChange}
          onConfirm={onConfirm}
        />,
      );
      expect(onConfirm).not.toHaveBeenCalled();
      await userEvent.click(screen.getByRole('button', { name }));
      const confirm = screen.getByRole('button', { name });
      expect(confirm).toBeDisabled();
      expect(confirm.querySelector('svg')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      fireEvent.click(confirm);
      await userEvent.keyboard('{Escape}');
      fireEvent.pointerDown(
        document.querySelector('[data-slot="alert-dialog-overlay"]')!,
      );
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onConfirm).toHaveBeenCalledWith(nutrient);
      expect(onOpenChange).not.toHaveBeenCalled();
      await act(async () => resolve?.());
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    },
  );

  it.each([NutrientStatusDialog, DeleteNutrientDialog])(
    'blocks confirmation and cancel for external pending (%s)',
    async (Component) => {
      const onConfirm = vi.fn();
      const onOpenChange = vi.fn();
      render(
        <Component
          nutrient={zinc}
          open
          pending
          onOpenChange={onOpenChange}
          onConfirm={onConfirm}
        />,
      );
      expect(screen.getAllByRole('button')).toHaveLength(2);
      screen
        .getAllByRole('button')
        .forEach((button) => expect(button).toBeDisabled());
      await userEvent.keyboard('{Escape}');
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(onConfirm).not.toHaveBeenCalled();
    },
  );

  it.each([
    [NutrientStatusDialog, 'Deactivate'],
    [DeleteNutrientDialog, 'Delete permanently'],
  ])(
    'keeps a failed confirmation open and displays the authoritative error (%s)',
    async (Component, name) => {
      const onOpenChange = vi.fn();
      render(
        <Component
          nutrient={zinc}
          open
          onOpenChange={onOpenChange}
          onConfirm={vi.fn().mockRejectedValue({
            status: 409,
            message: 'Used nutrient cannot be deleted.',
          })}
        />,
      );
      await userEvent.click(screen.getByRole('button', { name }));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Used nutrient cannot be deleted.',
      );
      expect(screen.getByRole('button', { name })).toBeEnabled();
      expect(onOpenChange).not.toHaveBeenCalled();
    },
  );

  it('explains deactivation preserves existing data and excludes new associations', () => {
    render(
      <NutrientStatusDialog
        nutrient={iron}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName(
      'Deactivate Iron?',
    );
    expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription(
      /Existing ingredient data remains.*new associations cannot select/i,
    );
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeDisabled();
  });

  it('permits cancellation without confirming and describes reactivation', async () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();
    render(
      <NutrientStatusDialog
        nutrient={{ ...iron, isActive: false }}
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName(
      'Reactivate Iron?',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe('NutrientDetailsDialog', () => {
  const renderDetails = (open = true, nutrient: Nutrient | null = iron) => {
    const store = configureStore({
      reducer: {
        auth: authReducer,
        [nutrientsApi.reducerPath]: nutrientsApi.reducer,
      },
      middleware: (getDefault) => getDefault().concat(nutrientsApi.middleware),
    });
    return render(
      <Provider store={store}>
        <NutrientDetailsDialog
          nutrient={nutrient}
          open={open}
          onOpenChange={vi.fn()}
        />
      </Provider>,
    );
  };

  it.each([
    [false, iron],
    [true, null],
  ])(
    'does not fetch when closed or no nutrient is selected',
    async (open, nutrient) => {
      const request = vi.spyOn(apiClient, 'request');
      renderDetails(open as boolean, nutrient as Nutrient | null);
      await act(async () => undefined);
      expect(request).not.toHaveBeenCalled();
    },
  );

  it('loads authoritative fields instead of the row snapshot', async () => {
    let resolve: ((value: { data: unknown }) => void) | undefined;
    vi.spyOn(apiClient, 'request').mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    renderDetails();
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Nutrient details');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading nutrient details',
    );
    expect(
      document.querySelector('[data-slot="skeleton"]'),
    ).toBeInTheDocument();
    await act(async () =>
      resolve?.({
        data: {
          id: 1,
          name: 'Updated Iron',
          unit: 'mcg',
          is_active: false,
          ingredient_count: 8,
        },
      }),
    );
    expect(await screen.findByText('Updated Iron')).toBeInTheDocument();
    expect(screen.getByText('mcg')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    ['Name', 'Unit', 'Status', 'Ingredient usage count'].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument(),
    );
  });

  it('retries a failed detail request and renders the returned details', async () => {
    vi.spyOn(apiClient, 'request')
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 503,
          data: { message: 'Details temporarily unavailable.' },
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 1,
          name: 'Iron',
          unit: 'mg',
          is_active: true,
          ingredient_count: 4,
        },
      });
    renderDetails();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Details temporarily unavailable.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Iron')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
