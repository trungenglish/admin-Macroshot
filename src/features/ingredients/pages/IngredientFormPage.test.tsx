import { configureStore } from '@reduxjs/toolkit';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { nutrientsApi } from '@/features/nutrients/api/nutrients-api';
import { apiClient } from '@/shared/api/api-client';
import { ingredientsApi } from '../api/ingredients-api';
import {
  ingredientTransportFixture as preview,
  resetIngredientFixtures,
} from '@/test/fixtures/ingredient-transport.fixture';
import { nutrientsApiFixtureAdapter } from '@/test/fixtures/nutrients-api.fixture-adapter';
import { IngredientFormPage } from './IngredientFormPage';

const runtime = vi.hoisted(() => ({ success: vi.fn() }));
vi.mock('../api/ingredient-transport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/ingredient-transport')>()),
  getIngredientTransport: async () =>
    (await import('@/test/fixtures/ingredient-transport.fixture'))
      .ingredientTransportFixture,
}));
vi.mock('sonner', () => ({ toast: { success: runtime.success } }));
const originalAdapter = apiClient.defaults.adapter;
const disposers: Array<() => void> = [];
function setup(entry = '/admin/ingredients/1/edit', entries?: string[]) {
  const store = configureStore({
    reducer: {
      [ingredientsApi.reducerPath]: ingredientsApi.reducer,
      [nutrientsApi.reducerPath]: nutrientsApi.reducer,
      auth: () => ({ accessToken: null }),
    },
    middleware: (getDefault) =>
      getDefault().concat(ingredientsApi.middleware, nutrientsApi.middleware),
  });
  const element = (
    <>
      <Link to='/elsewhere'>Sidebar</Link>
      <IngredientFormPage />
    </>
  );
  const router = createMemoryRouter(
    [
      { path: '/admin/ingredients/new', element },
      { path: '/admin/ingredients/:id/edit', element },
      { path: '/admin/ingredients', element: <p>Ingredient list</p> },
      { path: '/elsewhere', element: <p>Elsewhere</p> },
    ],
    {
      initialEntries: entries ?? [entry],
      initialIndex: entries ? entries.length - 1 : 0,
    },
  );
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
  disposers.push(() => {
    router.dispose();
    store.dispatch(ingredientsApi.util.resetApiState());
    store.dispatch(nutrientsApi.util.resetApiState());
  });
  return { store, router };
}
beforeEach(() => {
  resetIngredientFixtures();
  runtime.success.mockClear();
  apiClient.defaults.adapter = nutrientsApiFixtureAdapter;
});
afterEach(() => {
  cleanup();
  disposers.reverse().forEach((dispose) => dispose());
  disposers.length = 0;
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});
describe('IngredientFormPage', () => {
  // Break caught: invalid id falls into create, or unauthorized/incomplete record can be written.
  it.each(['invalid', '0', '101'])(
    'does not expose an editor for id %s',
    async (id) => {
      setup(`/admin/ingredients/${id}/edit`);
      expect(
        await screen.findByText(
          id === '101'
            ? 'Only system ingredients can be edited.'
            : 'Invalid ingredient ID. The editor is unavailable.',
        ),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Create ingredient' }),
      ).not.toBeInTheDocument();
    },
  );
  it('refuses missing nutrient metadata', async () => {
    const record = await preview.detail(1);
    vi.spyOn(preview, 'detail').mockResolvedValue({
      ...record,
      nutrientLinks: null,
    });
    setup();
    expect(
      await screen.findByText(
        'Ingredient nutrient metadata is unavailable. Editing is disabled.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
  });
  it('shows loading and retries a failed detail without create fallback', async () => {
    let fail!: (reason: unknown) => void;
    vi.spyOn(preview, 'detail').mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          fail = reject;
        }),
    );
    setup();
    expect(screen.getByRole('status')).toHaveTextContent('Loading ingredient');
    await waitFor(() => expect(typeof fail).toBe('function'));
    await act(async () =>
      fail({ status: 404, message: 'Ingredient unavailable.' }),
    );
    expect(
      await screen.findByText('Ingredient unavailable.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByLabelText('Name')).toHaveValue('Tomatoes');
  });
  // Break caught: background invalidation replaces RHF draft or unmounts editor.
  it('retains dirty draft through a real RTK detail refetch', async () => {
    const { store } = setup();
    await screen.findByLabelText('Name');
    await userEvent.type(screen.getByLabelText('Name'), ' draft');
    const record = await preview.detail(1);
    vi.spyOn(preview, 'detail').mockResolvedValue({
      ...record,
      name: 'Server changed',
    });
    await act(async () => {
      await store
        .dispatch(
          ingredientsApi.endpoints.getIngredient.initiate(1, {
            forceRefetch: true,
            subscribe: false,
          }),
        )
        .unwrap();
    });
    expect(screen.getByLabelText('Name')).toHaveValue('Tomatoes draft');
  });
  // Break caught: Cancel/Back/sidebar/pop bypass guard, or Stay resets RHF draft.
  it.each(['Cancel', 'Back', 'Sidebar', 'browser back'])(
    'guards dirty %s and keeps draft on Stay',
    async (action) => {
      const { router } = setup(undefined, [
        '/admin/ingredients',
        '/admin/ingredients/1/edit',
      ]);
      await screen.findByLabelText('Name');
      await userEvent.type(screen.getByLabelText('Name'), ' draft');
      if (action === 'browser back')
        await act(async () => {
          await router.navigate(-1);
        });
      else
        await userEvent.click(
          action === 'Sidebar'
            ? screen.getByRole('link', { name: action })
            : screen.getByRole('button', { name: action }),
        );
      expect(screen.getByRole('alertdialog')).toHaveAccessibleName(
        'Discard changes?',
      );
      await userEvent.click(screen.getByRole('button', { name: 'Stay' }));
      expect(router.state.location.pathname).toBe('/admin/ingredients/1/edit');
      expect(screen.getByLabelText('Name')).toHaveValue('Tomatoes draft');
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await userEvent.click(
        screen.getByRole('button', { name: 'Discard changes' }),
      );
      expect(await screen.findByText('Ingredient list')).toBeInTheDocument();
    },
  );
  it('prevents document unload only after edits', async () => {
    setup();
    await screen.findByLabelText('Name');
    const clean = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);
    await userEvent.type(screen.getByLabelText('Name'), ' draft');
    const dirty = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirty);
    expect(dirty.defaultPrevented).toBe(true);
  });
  // Break caught: success toast/navigation occur before fulfillment or stale guard blocks own save navigation.
  it('awaits save, prevents leaving pending, then navigates to safe list context without discard', async () => {
    let finish!: () => void;
    const original = preview.update.bind(preview);
    const update = vi
      .spyOn(preview, 'update')
      .mockImplementation(async (id, input) => {
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
        return original(id, input);
      });
    const { router } = setup(
      '/admin/ingredients/1/edit?returnTo=%2Fadmin%2Fingredients%3Fpage%3D2%26search%3Drice',
    );
    await screen.findByLabelText('Name');
    await userEvent.type(screen.getByLabelText('Name'), ' edited');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(runtime.success).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe('/admin/ingredients/1/edit');
    await userEvent.click(screen.getByRole('link', { name: 'Sidebar' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('wait');
    expect(
      screen.queryByRole('button', { name: 'Discard changes' }),
    ).not.toBeInTheDocument();
    await act(async () => finish());
    await screen.findByText('Ingredient list');
    expect(update).toHaveBeenCalledTimes(1);
    expect(router.state.location.search).toBe('?page=2&search=rice');
    expect(runtime.success).toHaveBeenCalledWith('Ingredient updated.');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
  it('retains failed-save draft and does not toast or navigate', async () => {
    vi.spyOn(preview, 'update').mockRejectedValue({
      status: 422,
      message: 'Check fields.',
      fieldErrors: { name: 'Rejected name.' },
    });
    const { router } = setup();
    await screen.findByLabelText('Name');
    await userEvent.type(screen.getByLabelText('Name'), ' draft');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Rejected name.')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveFocus();
    expect(screen.getByLabelText('Name')).toHaveValue('Tomatoes draft');
    expect(runtime.success).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe('/admin/ingredients/1/edit');
  });
  it('allows explicit inactive link removal through a fixture-backed save', async () => {
    setup('/admin/ingredients/2/edit');
    await screen.findByLabelText('Name');
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Legacy fiber' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Ingredient list');
    expect((await preview.detail(2)).nutrientLinks).toEqual([]);
  });
  // Break caught: create is sent to update or unsafe returnTo becomes a navigation target.
  it('creates complete system input and rejects an unsafe return target', async () => {
    let finish!: () => void;
    const original = preview.create.bind(preview);
    vi.spyOn(preview, 'create').mockImplementation(async (input) => {
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      return original(input);
    });
    const { router } = setup(
      '/admin/ingredients/new?returnTo=https%3A%2F%2Fevil.example',
    );
    for (const [label, value] of [
      ['Name', 'New lentils'],
      ['Calories (kcal / 100g)', '120'],
      ['Protein (g / 100g)', '9'],
      ['Carbohydrate (g / 100g)', '20'],
      ['Fat (g / 100g)', '1'],
    ])
      await userEvent.type(screen.getByLabelText(label), value);
    await userEvent.click(
      screen.getByRole('button', { name: 'Create ingredient' }),
    );
    expect(runtime.success).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe('/admin/ingredients/new');
    expect(
      screen.getByRole('button', { name: 'Create ingredient' }),
    ).toBeDisabled();
    await act(async () => finish());
    await screen.findByText('Ingredient list');
    expect(router.state.location.pathname).toBe('/admin/ingredients');
    expect(runtime.success).toHaveBeenCalledWith('Ingredient created.');
    expect(await preview.detail(102)).toMatchObject({
      name: 'New lentils',
      isSystem: true,
      userId: null,
      lastInputType: '100g',
      calPer100g: 120,
      proPer100g: 9,
      carbPer100g: 20,
      fatPer100g: 1,
      nutrientLinks: [],
    });
  });
});
