import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppProviders } from '@/app/providers';
import { AdminSignInPage } from '@/features/auth/pages/AdminSignInPage';
import { apiClient } from '@/shared/api/api-client';

describe('AdminSignInPage', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('navigates to the ingredients page after a successful login', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        message: 'Admin login successful',
        data: {
          access_token: 'access-token',
          user: {
            id: 1,
            full_name: 'Admin User',
            email: 'admin@example.com',
          },
        },
      },
    });
    const router = createMemoryRouter(
      [
        { path: '/login', element: <AdminSignInPage /> },
        {
          path: '/admin/ingredients',
          element: <h1>Ingredients</h1>,
        },
      ],
      {
      initialEntries: ['/login'],
      },
    );
    const user = userEvent.setup();

    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    await user.type(await screen.findByLabelText('Username'), 'admin');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/admin/ingredients');
    });
  });
});
