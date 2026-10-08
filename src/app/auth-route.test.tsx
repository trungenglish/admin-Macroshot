import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import authReducer, {
  ADMIN_TOKEN_STORAGE_KEY,
} from '@/features/auth/store/auth-slice';
import { AdminSignInPage } from '@/features/auth/pages/AdminSignInPage';
import { apiClient } from '@/shared/api/api-client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { useAppSelector } from './store-hooks';

function AdminDestination({ title }: { title: string }) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  return (
    <>
      <h1>{title}</h1>
      <output aria-label='active token'>{accessToken}</output>
    </>
  );
}

function renderApp(
  initialEntry: string | { pathname: string; state?: unknown },
) {
  const store = configureStore({ reducer: { auth: authReducer } });
  const router = createMemoryRouter(
    [
      {
        element: <AuthLayout />,
        children: [{ path: '/login', element: <AdminSignInPage /> }],
      },
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          {
            path: 'ingredients',
            element: <AdminDestination title='Ingredients' />,
          },
          {
            path: 'nutrients',
            element: <AdminDestination title='Nutrients' />,
          },
        ],
      },
    ],
    { initialEntries: [initialEntry] },
  );
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
  return router;
}

describe('admin route protection', () => {
  beforeEach(() => localStorage.clear());

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('redirects unauthenticated admin requests to login and preserves the destination', async () => {
    const router = renderApp('/admin/nutrients?unit=mg');

    expect(await screen.findByLabelText('Username')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.state).toEqual({
      from: '/admin/nutrients?unit=mg',
    });
  });

  it('restores the stored token before loading an admin route', async () => {
    localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, 'saved-admin-token');
    renderApp('/admin/nutrients');

    expect(await screen.findByRole('heading', { name: 'Nutrients' })).toBeInTheDocument();
    expect(screen.getByLabelText('active token')).toHaveTextContent(
      'saved-admin-token',
    );
  });

  it('redirects an already authenticated visitor away from login', async () => {
    localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, 'saved-admin-token');
    const router = renderApp('/login');

    expect(
      await screen.findByRole('heading', { name: 'Ingredients' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/ingredients');
  });

  it('returns to the originally requested admin route after login', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        message: 'Admin login successful',
        data: {
          access_token: 'new-admin-token',
          user: {
            id: 1,
            full_name: 'Admin User',
            email: 'admin@example.com',
          },
        },
      },
    });
    const router = renderApp({
      pathname: '/login',
      state: { from: '/admin/nutrients?unit=mg' },
    });
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Username'), 'admin');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByRole('heading', { name: 'Nutrients' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/nutrients');
    expect(router.state.location.search).toBe('?unit=mg');
  });
});
