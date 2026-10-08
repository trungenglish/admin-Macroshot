import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppProviders } from '@/app/providers';
import { appRouter } from '@/app/router';
import { store } from '@/app/store';
import { usersApi } from '@/features/users/api/users-api';
import {
  ADMIN_TOKEN_STORAGE_KEY,
  restoreAdminSession,
} from '@/features/auth/store/auth-slice';
import { apiClient } from '@/shared/api/api-client';

describe('users app integration', () => {
  beforeEach(() => {
    localStorage.removeItem('vite-ui-theme');
    localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, 'route-test-token');
    store.dispatch(restoreAdminSession('route-test-token'));
    vi.spyOn(apiClient, 'request').mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [],
          meta: { total: 0, skip: 0, limit: 10, count: 0 },
        },
        message: 'OK',
        timestamp: '',
      },
    });
  });

  afterEach(() => {
    store.dispatch(usersApi.util.resetApiState());
    localStorage.removeItem('vite-ui-theme');
    localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    store.dispatch(restoreAdminSession(null));
    document.documentElement.classList.remove('light', 'dark');
    vi.restoreAllMocks();
  });

  it('loads the users route and marks its sidebar link active', async () => {
    const router = createMemoryRouter(appRouter.routes, {
      initialEntries: ['/admin/users'],
    });
    await waitFor(() => expect(router.state.initialized).toBe(true), {
      timeout: 12_000,
    });
    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Users' }),
    ).toBeInTheDocument();
    await waitFor(() => {
      const link = within(
        document.querySelector('[data-slot="sidebar-content"]')!,
      ).getByRole('link', { name: 'Users' });
      expect(link).toHaveAttribute('href', '/admin/users');
      expect(link).toHaveAttribute('aria-current', 'page');
    });
  }, 15_000);

  it('changes the persisted theme from the desktop sidebar', async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(appRouter.routes, {
      initialEntries: ['/admin/users'],
    });
    await waitFor(() => expect(router.state.initialized).toBe(true), {
      timeout: 12_000,
    });
    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    await user.click(await screen.findByRole('button', { name: 'Appearance' }));
    expect(screen.getByRole('menuitem', { name: 'Light' })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: 'System' })).toBeVisible();
    await user.click(screen.getByRole('menuitem', { name: 'Dark' }));

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('dark');
      expect(localStorage.getItem('vite-ui-theme')).toBe('dark');
    });
  }, 15_000);
});
