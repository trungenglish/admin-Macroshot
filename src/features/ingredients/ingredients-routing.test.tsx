import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import {
  createMemoryRouter,
  RouterProvider,
  useParams,
} from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appRouter } from '@/app/router';
import { store } from '@/app/store';
import {
  ADMIN_TOKEN_STORAGE_KEY,
  restoreAdminSession,
} from '@/features/auth/store/auth-slice';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';

vi.mock('@/features/ingredients/pages/IngredientsPage', () => ({
  IngredientsPage: () => <h1>Ingredient list route</h1>,
}));
vi.mock('@/features/ingredients/pages/IngredientFormPage', () => ({
  IngredientFormPage: () => {
    const { id } = useParams();
    return <h1>{id ? `Edit ingredient ${id}` : 'New ingredient'}</h1>;
  },
}));
vi.mock('@/features/nutrients/pages/NutrientsPage', () => ({
  NutrientsPage: () => <h1>Nutrient list route</h1>,
}));

const routers: Array<ReturnType<typeof createMemoryRouter>> = [];

beforeEach(() => {
  localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, 'route-test-token');
  store.dispatch(restoreAdminSession('route-test-token'));
});

async function renderAt(path: string) {
  const router = createMemoryRouter(appRouter.routes, {
    initialEntries: [path],
  });
  routers.push(router);
  await waitFor(() => expect(router.state.initialized).toBe(true), {
    timeout: 12_000,
  });
  render(
    <Provider store={store}>
      <ThemeProvider defaultTheme='system'>
        <RouterProvider router={router} />
      </ThemeProvider>
    </Provider>,
  );
  return router;
}

afterEach(() => {
  routers.splice(0).forEach((router) => router.dispose());
  localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  store.dispatch(restoreAdminSession(null));
});

describe('admin ingredient routes', () => {
  it.each([
    ['/admin/ingredients', 'Ingredient list route'],
    ['/admin/ingredients/new', 'New ingredient'],
    ['/admin/ingredients/42/edit', 'Edit ingredient 42'],
  ])(
    'renders %s without an auth redirect',
    async (path, heading) => {
      const router = await renderAt(path);
      expect(
        await screen.findByRole('heading', { name: heading }),
      ).toBeVisible();
      expect(router.state.location.pathname).toBe(path);
    },
    15_000,
  );

  it.each(['/admin/ingredients/new', '/admin/ingredients/42/edit'])(
    'keeps Ingredients active at descendant %s',
    async (path) => {
      await renderAt(path);
      const link = await screen.findByRole('link', { name: 'Ingredients' });
      expect(link).toHaveAttribute('href', '/admin/ingredients');
      expect(link).toHaveAttribute('data-active', 'true');
      expect(link).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('link', { name: 'Nutrients' })).toHaveAttribute(
        'data-active',
        'false',
      );
    },
  );

  it('preserves the Nutrients route and active sidebar item', async () => {
    const router = await renderAt('/admin/nutrients');
    expect(
      await screen.findByRole('heading', { name: 'Nutrient list route' }),
    ).toBeVisible();
    expect(router.state.location.pathname).toBe('/admin/nutrients');
    expect(screen.getByRole('link', { name: 'Nutrients' })).toHaveAttribute(
      'data-active',
      'true',
    );
  });
});
