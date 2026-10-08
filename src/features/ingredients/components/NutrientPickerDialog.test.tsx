import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { nutrientsApi } from '@/features/nutrients/api/nutrients-api';
import { apiClient } from '@/shared/api/api-client';
import { resetIngredientFixtures } from '@/test/fixtures/ingredient-transport.fixture';
import { nutrientsApiFixtureAdapter } from '@/test/fixtures/nutrients-api.fixture-adapter';
import { NutrientPickerDialog } from './NutrientPickerDialog';

const originalAdapter = apiClient.defaults.adapter;
const stores: ReturnType<typeof makeStore>[] = [];
function makeStore() {
  return configureStore({
    reducer: {
      [nutrientsApi.reducerPath]: nutrientsApi.reducer,
      auth: () => ({ accessToken: null }),
    },
    middleware: (getDefault) => getDefault().concat(nutrientsApi.middleware),
  });
}
function setup(selectedIds: number[] = []) {
  const store = makeStore();
  stores.push(store);
  const onSelect = vi.fn();
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Choose nutrient</button>
        <NutrientPickerDialog
          open={open}
          onOpenChange={setOpen}
          selectedIds={selectedIds}
          onSelect={onSelect}
        />
      </>
    );
  }
  render(
    <Provider store={store}>
      <Harness />
    </Provider>,
  );
  return { onSelect };
}
beforeEach(() => {
  resetIngredientFixtures();
  apiClient.defaults.adapter = nutrientsApiFixtureAdapter;
});
afterEach(() => {
  stores.forEach((store) => store.dispatch(nutrientsApi.util.resetApiState()));
  stores.length = 0;
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});
describe('NutrientPickerDialog', () => {
  // Break caught: selection uses first-page/stale data or includes duplicate/inactive options.
  it('filters selected and inactive nutrients and selects a real later server page', async () => {
    const { onSelect } = setup([1]);
    await userEvent.click(
      screen.getByRole('button', { name: 'Choose nutrient' }),
    );
    await screen.findByRole('button', { name: 'Add Calcium' });
    expect(
      screen.queryByRole('button', { name: 'Add Iron' }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Add Selenium' }),
    );
    expect(onSelect).toHaveBeenCalledWith({
      id: 14,
      name: 'Selenium',
      unit: 'mg',
      isActive: true,
      ingredientCount: 0,
    });
    expect(
      screen.queryByRole('button', { name: 'Add Legacy fiber' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  // Break caught: search retains later page or escape does not restore trigger focus.
  it('resets server page on search and supports keyboard close/focus', async () => {
    setup();
    await userEvent.click(
      screen.getByRole('button', { name: 'Choose nutrient' }),
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Add nutrient');
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription();
    await screen.findByRole('button', { name: 'Add Iron' });
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('button', { name: 'Add Selenium' });
    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Search nutrients' }),
      'Iron',
    );
    await screen.findByRole('button', { name: 'Add Iron' });
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: 'Choose nutrient' }),
    ).toHaveFocus();
  });
  // Break caught: old current-page options remain selectable during a new server request.
  it('does not display stale options while a new page is loading', async () => {
    setup();
    await userEvent.click(
      screen.getByRole('button', { name: 'Choose nutrient' }),
    );
    await screen.findByRole('button', { name: 'Add Iron' });
    vi.spyOn(apiClient, 'request').mockImplementation(
      () => new Promise(() => {}),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      screen.queryByRole('button', { name: 'Add Iron' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading nutrients');
  });
});
