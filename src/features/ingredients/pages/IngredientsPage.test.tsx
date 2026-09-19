import { configureStore } from '@reduxjs/toolkit';
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nutrientsApi } from '@/features/nutrients/api/nutrients-api';
import { ingredientsApi } from '../api/ingredients-api';
import {
  previewIngredientTransport as preview,
  resetIngredientsPreview,
} from '../dev/ingredients-preview';
import { IngredientsPage } from './IngredientsPage';

const runtime = vi.hoisted(() => ({ success: vi.fn() }));
vi.mock('../api/ingredient-transport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/ingredient-transport')>()),
  isIngredientsPreview: true,
  getIngredientTransport: async () =>
    (await import('../dev/ingredients-preview')).previewIngredientTransport,
}));
vi.mock('sonner', () => ({ toast: { success: runtime.success } }));
const disposers: Array<() => void> = [];
function setup(entry = '/admin/ingredients') {
  const store = configureStore({
    reducer: {
      [ingredientsApi.reducerPath]: ingredientsApi.reducer,
      [nutrientsApi.reducerPath]: nutrientsApi.reducer,
    },
    middleware: (getDefault) =>
      getDefault().concat(ingredientsApi.middleware, nutrientsApi.middleware),
  });
  const router = createMemoryRouter(
    [
      { path: '/admin/ingredients', element: <IngredientsPage /> },
      { path: '/admin/ingredients/new', element: <p>Create page</p> },
      { path: '/admin/ingredients/:id/edit', element: <p>Edit page</p> },
    ],
    { initialEntries: [entry] },
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
async function rowAction(name: string, action: string) {
  await userEvent.click(
    await screen.findByRole('button', { name: `Actions for ${name}` }),
  );
  await userEvent.click(screen.getByRole('menuitem', { name: action }));
}
beforeEach(() => {
  resetIngredientsPreview();
  runtime.success.mockClear();
  // Match the Nutrients tests: jsdom lacks these Radix Select browser APIs.
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.setPointerCapture = () => undefined;
  HTMLElement.prototype.releasePointerCapture = () => undefined;
  HTMLElement.prototype.scrollIntoView = () => undefined;
});
afterEach(() => {
  cleanup();
  disposers.splice(0).forEach((dispose) => dispose());
  vi.restoreAllMocks();
});
describe('IngredientsPage', () => {
  // Break caught: stale RTK data under a new URL remains visible or is locally paginated.
  it('shows server pages, system rows and all mandatory columns', async () => {
    setup();
    expect(screen.getByRole('status')).toHaveTextContent('Loading ingredients');
    const table = await screen.findByRole('table', { name: 'Ingredients' });
    expect(screen.getByText('14 ingredients')).toBeVisible();
    for (const name of [
      'ID',
      'Name',
      'Unit',
      'Calories',
      'Protein',
      'Carbs',
      'Fat',
      'Recipe usage',
      'Actions',
    ])
      expect(within(table).getByRole('columnheader', { name })).toBeVisible();
    expect(within(table).getAllByRole('row')).toHaveLength(11);
    expect(screen.queryByText('Personal ingredient')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Bananas')).toBeVisible();
    expect(screen.queryByText('Tomatoes')).not.toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeVisible();
  });
  it.each([401, 403, 500])(
    'shows %s errors and retries without synthetic success',
    async (status) => {
      vi.spyOn(preview, 'list').mockRejectedValueOnce({
        status,
        message: `List failed ${status}.`,
      });
      setup();
      expect(await screen.findByText(`List failed ${status}.`)).toBeVisible();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
      expect(await screen.findByText('Tomatoes')).toBeVisible();
    },
  );
  it('does not expose personal rows even if a transport returns them', async () => {
    const personal = await preview.detail(101);
    vi.spyOn(preview, 'list').mockResolvedValue({
      items: [personal],
      total: 1,
      page: 1,
      pageSize: 10,
    });
    setup();
    await screen.findByRole('table');
    expect(screen.queryByText('Personal ingredient')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Actions for Personal ingredient' }),
    ).not.toBeInTheDocument();
  });
  it('distinguishes empty and no-results and clears filters', async () => {
    vi.spyOn(preview, 'list').mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    });
    const { router } = setup('/admin/ingredients?search=missing&unit=cup');
    expect(await screen.findByText('No matching ingredients')).toBeVisible();
    await userEvent.click(
      screen.getByRole('button', { name: 'Clear filters' }),
    );
    expect(await screen.findByText('No ingredients yet')).toBeVisible();
    expect(router.state.location.search).toBe('');
  });
  it('retains pagination recovery on a positive-total empty page', async () => {
    vi.spyOn(preview, 'list').mockResolvedValue({
      items: [],
      total: 10,
      page: 2,
      pageSize: 10,
    });
    const { router } = setup('/admin/ingredients?page=2&unit=cup');
    expect(
      await screen.findByText('No ingredients on this page.'),
    ).toBeVisible();
    expect(
      screen.queryByText('No matching ingredients'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Rows per page' }),
    ).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(router.state.location.search).toBe('?unit=cup');
  });
  it.each(['search', 'unit', 'pageSize'])(
    'resets page after changing %s and preserves other query fields',
    async (field) => {
      const { router } = setup(
        '/admin/ingredients?page=2&pageSize=25&search=a&unit=g',
      );
      await screen.findByRole('table');
      if (field === 'pageSize') {
        await userEvent.click(
          screen.getByRole('combobox', { name: 'Rows per page' }),
        );
        await userEvent.click(screen.getByRole('option', { name: '50' }));
      } else {
        const control = screen.getByRole(
          field === 'search' ? 'searchbox' : 'textbox',
          { name: field === 'search' ? 'Search ingredients' : 'Unit filter' },
        );
        await userEvent.clear(control);
        await userEvent.type(control, field === 'search' ? 'rice' : 'cup');
      }
      const params = new URLSearchParams(router.state.location.search);
      expect(params.has('page')).toBe(false);
      expect(params.get('pageSize')).toBe(field === 'pageSize' ? '50' : '25');
      expect(params.get('search')).toBe(field === 'search' ? 'rice' : 'a');
      expect(params.get('unit')).toBe(field === 'unit' ? 'cup' : 'g');
    },
  );
  it.each(['Add ingredient', 'Edit'])(
    'navigates %s to a separate page with sanitized return context',
    async (action) => {
      const { router } = setup(
        '/admin/ingredients?pageSize=25&search=Tomatoes&unexpected=unsafe',
      );
      await screen.findByText('Tomatoes');
      if (action === 'Edit') await rowAction('Tomatoes', 'Edit');
      else await userEvent.click(screen.getByRole('link', { name: action }));
      expect(router.state.location.pathname).toBe(
        action === 'Edit'
          ? '/admin/ingredients/1/edit'
          : '/admin/ingredients/new',
      );
      expect(
        new URLSearchParams(router.state.location.search).get('returnTo'),
      ).toBe('/admin/ingredients?pageSize=25&search=Tomatoes');
    },
  );
  it('hides stale URL results during a delayed server request', async () => {
    const { router } = setup();
    await screen.findByText('Tomatoes');
    let finish!: () => void;
    const original = preview.list.bind(preview);
    vi.spyOn(preview, 'list').mockImplementation(async (query) => {
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      return original(query);
    });
    await act(async () => {
      await router.navigate('/admin/ingredients?search=rice');
    });
    await waitFor(() => expect(typeof finish).toBe('function'));
    expect(screen.queryByText('Tomatoes')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading ingredients');
    await act(async () => finish());
    expect(await screen.findByText('Brown rice')).toBeVisible();
  });
  // Break caught: trimming each keystroke removes spaces inside a multiword search.
  it('allows typing a multiword search while keeping the URL query trimmed', async () => {
    const { router } = setup();
    await screen.findByText('Tomatoes');
    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Search ingredients' }),
      'Brown rice ',
    );
    expect(
      screen.getByRole('searchbox', { name: 'Search ingredients' }),
    ).toHaveValue('Brown rice ');
    expect(
      new URLSearchParams(router.state.location.search).get('search'),
    ).toBe('Brown rice');
    expect(await screen.findByText('Brown rice')).toBeVisible();
    await act(async () => {
      await router.navigate('/admin/ingredients?search=Tomatoes');
    });
    expect(
      screen.getByRole('searchbox', { name: 'Search ingredients' }),
    ).toHaveValue('Tomatoes');
  });
  it('keeps current rows with fetching feedback during a background refresh', async () => {
    const { store } = setup();
    await screen.findByText('Tomatoes');
    let finish!: () => void;
    const original = preview.list.bind(preview);
    vi.spyOn(preview, 'list').mockImplementation(async (query) => {
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      return original(query);
    });
    let request!: Promise<unknown>;
    act(() => {
      request = store.dispatch(
        ingredientsApi.endpoints.listIngredients.initiate(
          { page: 1, pageSize: 10, search: '' },
          { forceRefetch: true, subscribe: false },
        ),
      );
    });
    expect(await screen.findByText('Refreshing ingredients')).toBeVisible();
    expect(screen.getByText('Tomatoes')).toBeVisible();
    expect(
      screen.getByRole('region', { name: 'Ingredient results' }),
    ).toHaveAttribute('aria-busy', 'true');
    await act(async () => {
      finish();
      await request;
    });
  });
  it('fetches read-only complete detail with decimal nutrient values per 100g', async () => {
    const record = await preview.detail(1);
    vi.spyOn(preview, 'detail').mockResolvedValue({
      ...record,
      name: 'Authoritative Tomatoes',
      imageUrl: 'https://example.com/tomato.png',
    });
    setup();
    await rowAction('Tomatoes', 'View details');
    const dialog = screen.getByRole('dialog');
    expect(
      await within(dialog).findByText('Authoritative Tomatoes'),
    ).toBeVisible();
    expect(within(dialog).getByText('0.25 mg / 100g')).toBeVisible();
    expect(within(dialog).getByText('18 kcal / 100g')).toBeVisible();
    expect(within(dialog).getByText('100 g')).toBeVisible();
    expect(within(dialog).getByRole('img')).toHaveAttribute(
      'src',
      'https://example.com/tomato.png',
    );
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument();
  });
  it('labels unknown metadata honestly rather than empty or zero', async () => {
    const record = await preview.detail(1);
    vi.spyOn(preview, 'detail').mockResolvedValue({
      ...record,
      recipeCount: null,
      nutrientLinks: null,
    });
    setup();
    await rowAction('Tomatoes', 'View details');
    const dialog = screen.getByRole('dialog');
    expect(
      await within(dialog).findByText('Nutrient metadata is unavailable.'),
    ).toBeVisible();
    expect(within(dialog).getByText('Unknown')).toBeVisible();
    expect(within(dialog).getByText('No image available.')).toBeVisible();
    expect(
      within(dialog).queryByText('No nutrient links.'),
    ).not.toBeInTheDocument();
  });
  it('rejects personal detail and does not reveal its fields', async () => {
    vi.spyOn(preview, 'detail').mockResolvedValue(await preview.detail(101));
    setup();
    await rowAction('Tomatoes', 'View details');
    expect(
      await screen.findByText('Only system ingredients can be viewed.'),
    ).toBeVisible();
    expect(screen.queryByText('Personal ingredient')).not.toBeInTheDocument();
  });
  it('retries failed detail in place', async () => {
    vi.spyOn(preview, 'detail').mockRejectedValueOnce({
      status: 500,
      message: 'Detail failed.',
    });
    setup();
    await rowAction('Tomatoes', 'View details');
    expect(await screen.findByText('Detail failed.')).toBeVisible();
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Retry' }),
    );
    expect(
      await within(screen.getByRole('dialog')).findByText('Tomatoes'),
    ).toBeVisible();
  });
  // Break caught: failed delete invalidates/refetches or removes row; pending announces success.
  it('retains row and dialog on 409, then refreshes only after a successful delete', async () => {
    const list = vi.spyOn(preview, 'list');
    const original = preview.delete.bind(preview);
    let finish!: () => void;
    vi.spyOn(preview, 'delete')
      .mockRejectedValueOnce({ status: 409, message: 'Conflict.' })
      .mockImplementation(async (id) => {
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
        await original(id);
      });
    setup();
    const table = await screen.findByRole('table', { name: 'Ingredients' });
    await rowAction('Tomatoes', 'Delete');
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
        'This ingredient is used by a recipe and cannot be deleted.',
      ),
    ).toBeVisible();
    expect(within(table).getByText('Tomatoes')).toBeVisible();
    expect(list).toHaveBeenCalledTimes(1);
    expect(runtime.success).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete permanently' }),
    );
    await waitFor(() => expect(typeof finish).toBe('function'));
    expect(list).toHaveBeenCalledTimes(1);
    expect(within(table).getByText('Tomatoes')).toBeVisible();
    await act(async () => finish());
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        within(screen.getByRole('table')).queryByText('Tomatoes'),
      ).not.toBeInTheDocument(),
    );
    expect(list).toHaveBeenCalledTimes(2);
    expect(runtime.success).toHaveBeenCalledWith('Ingredient deleted.');
  });
  it('rechecks latest list usage while a delete dialog is open', async () => {
    const { store } = setup();
    await rowAction('Tomatoes', 'Delete');
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Delete permanently' }),
      ).toBeEnabled(),
    );
    const record = await preview.detail(1);
    const original = preview.list.bind(preview);
    vi.spyOn(preview, 'list').mockImplementation(async (query) => {
      const result = await original(query);
      return {
        ...result,
        items: result.items.map((item) =>
          item.id === 1 ? { ...record, recipeCount: 2 } : item,
        ),
      };
    });
    const remove = vi.spyOn(preview, 'delete');
    await act(async () => {
      await store
        .dispatch(
          ingredientsApi.endpoints.listIngredients.initiate(
            { page: 1, pageSize: 10, search: '' },
            { forceRefetch: true, subscribe: false },
          ),
        )
        .unwrap();
    });
    expect(screen.getByRole('alertdialog')).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Delete permanently' }),
      ).toBeDisabled(),
    );
    expect(
      screen.getByText(
        'This ingredient is used by a recipe and cannot be deleted.',
      ),
    ).toBeVisible();
    expect(remove).not.toHaveBeenCalled();
  });
  it('fails closed if the selected row leaves the current URL scope during confirmation refresh', async () => {
    const record = await preview.detail(1);
    let finish!: () => void;
    vi.spyOn(preview, 'detail')
      .mockResolvedValueOnce(record)
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = () => resolve(record);
          }),
      );
    const remove = vi.spyOn(preview, 'delete');
    const { router } = setup();
    await rowAction('Tomatoes', 'Delete');
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Delete permanently' }),
      ).toBeEnabled(),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete permanently' }),
    );
    await waitFor(() => expect(typeof finish).toBe('function'));
    await act(async () => {
      await router.navigate('/admin/ingredients?search=rice');
    });
    await act(async () => finish());
    expect(
      await screen.findByText(
        'Recipe usage is unavailable. Deletion is disabled.',
      ),
    ).toBeVisible();
    expect(remove).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeVisible();
  });
});
