import { act, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppProviders } from '@/app/providers';
import { appRouter } from '@/app/router';
import { store } from '@/app/store';
import { nutrientsApi } from '@/features/nutrients/api/nutrients-api';
import '@/features/nutrients/pages/NutrientsPage';
import { apiClient } from '@/shared/api/api-client';

async function renderRoute(path: string) {
  const router = createMemoryRouter(appRouter.routes, {
    initialEntries: [path],
  });
  await waitFor(() => expect(router.state.initialized).toBe(true), {
    timeout: 5000,
  });
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
}

describe('nutrients app integration', () => {
  beforeEach(() => {
    localStorage.removeItem('vite-ui-theme');
    vi.spyOn(apiClient, 'request').mockResolvedValue({
      data: { items: [], total: 0, skip: 0, limit: 10 },
    });
  });

  afterEach(() => {
    toast.dismiss();
    store.dispatch(nutrientsApi.util.resetApiState());
    localStorage.removeItem('vite-ui-theme');
    vi.restoreAllMocks();
  });

  it('loads the real lazy nutrients route without login and marks its sidebar link active', async () => {
    const router = await renderRoute('/admin/nutrients?unit=mg&isActive=false');
    expect(
      await screen.findByRole('heading', { name: 'Nutrients' }),
    ).toBeInTheDocument();
    const link = within(
      document.querySelector('[data-slot="sidebar-content"]')!,
    ).getByRole('link', { name: 'Nutrients' });
    expect(link).toHaveAttribute('href', '/admin/nutrients');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveAttribute('data-active', 'true');
    expect(router.state.location.search).toBe('?unit=mg&isActive=false');
    expect(
      screen.queryByRole('heading', { name: /sign in/i }),
    ).not.toBeInTheDocument();
  });

  it('does not mark Nutrients active at the admin parent route', async () => {
    await renderRoute('/admin');
    const link = await screen.findByRole('link', { name: 'Nutrients' });
    expect(link).toHaveAttribute('href', '/admin/nutrients');
    expect(link).not.toHaveAttribute('aria-current');
    expect(link).toHaveAttribute('data-active', 'false');
  });

  it('renders one global themed toaster after provider children', async () => {
    localStorage.setItem('vite-ui-theme', 'dark');
    render(
      <AppProviders>
        <p>Provider content</p>
      </AppProviders>,
    );
    await act(async () => {
      toast.success('Integration saved.');
    });
    expect(await screen.findByText('Integration saved.')).toBeInTheDocument();
    await waitFor(() =>
      expect(document.querySelectorAll('[data-sonner-toaster]')).toHaveLength(
        1,
      ),
    );
    const toaster = document.querySelector('[data-sonner-toaster]');
    expect(toaster).toHaveAttribute('data-sonner-theme', 'dark');
    expect(
      screen.getByText('Provider content').compareDocumentPosition(toaster!),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      screen.getByRole('button', { name: 'Close toast' }),
    ).toBeInTheDocument();
  });
});
