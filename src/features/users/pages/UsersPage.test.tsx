import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UsersPage } from './UsersPage';

const useGetUsersQuery = vi.fn();

vi.mock('../api/users-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/users-api')>()),
  useGetUsersQuery: (...args: unknown[]) => useGetUsersQuery(...args),
}));

const user = {
  id: 7,
  fullName: 'Nguyen Minh Anh',
  username: 'minhanh',
  email: 'anh@example.com',
  gender: 'female' as const,
  role: 'user',
  dateOfBirth: '1992-06-12',
  avatarUrl: null,
  heightCm: 162,
  weightKg: 54,
  activityLevel: 'lightly_active',
  desiredWeightKg: 50,
  goalPaceKgPerWeek: 0.3,
  createdAt: '2026-10-03T16:21:53.231Z',
  updatedAt: '2026-10-03T16:21:53.231Z',
  isNewUser: true,
};

describe('UsersPage', () => {
  beforeEach(() => {
    HTMLElement.prototype.hasPointerCapture = () => false;
    HTMLElement.prototype.setPointerCapture = () => undefined;
    HTMLElement.prototype.releasePointerCapture = () => undefined;
    HTMLElement.prototype.scrollIntoView = () => undefined;
    useGetUsersQuery.mockReturnValue({
      data: { items: [user], total: 1, page: 1, pageSize: 10 },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it('renders the approved columns and onboarding label', () => {
    render(<UsersPage />, { wrapper: MemoryRouter });
    const table = screen.getByRole('table', { name: 'Users' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual([
      'User',
      'Email',
      'Gender',
      'Role',
      'Initial setup',
      'Joined',
      'Actions',
    ]);
    expect(within(table).getByText('Not completed')).toBeInTheDocument();
  });

  it('opens the details dialog with profile-only fields', async () => {
    render(<UsersPage />, { wrapper: MemoryRouter });
    const table = screen.getByRole('table', { name: 'Users' });
    fireEvent.pointerDown(
      within(table).getByRole('button', {
        name: 'Actions for Nguyen Minh Anh',
      }),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'View details' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('minhanh')).toBeInTheDocument();
    expect(within(dialog).getByText('162 cm')).toBeInTheDocument();
    expect(within(dialog).getByText('0.3 kg/week')).toBeInTheDocument();
  });
});
