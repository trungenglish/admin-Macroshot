import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMemoryRouter,
  RouterProvider,
  useLocation,
} from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NutrientsPage } from './NutrientsPage';
import type { Nutrient, NutrientListResult } from '../nutrient.types';

const hooks = vi.hoisted(() => ({
  useGetNutrientsQuery: vi.fn(),
  useGetNutrientQuery: vi.fn(),
  useCreateNutrientMutation: vi.fn(),
  useUpdateNutrientMutation: vi.fn(),
  useDeleteNutrientMutation: vi.fn(),
  success: vi.fn(),
}));
vi.mock('../api/nutrients-api', () => hooks);
vi.mock('sonner', () => ({ toast: { success: hooks.success } }));

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
const result: NutrientListResult = {
  items: [iron, zinc],
  total: 30,
  page: 1,
  pageSize: 10,
  summary: {
    total: 30,
    active: 24,
    inactive: 6,
  },
};
const refetch = vi.fn();
const create = vi.fn();
const update = vi.fn();
const deleteNutrient = vi.fn();
const queryState = (overrides = {}) => ({
  data: result,
  currentData: result,
  isLoading: false,
  isFetching: false,
  isError: false,
  refetch,
  ...overrides,
});

function LocationProbe() {
  return <output data-testid='location-search'>{useLocation().search}</output>;
}

function renderPage(initialEntry: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/admin/nutrients',
        element: (
          <>
            <NutrientsPage />
            <LocationProbe />
          </>
        ),
      },
    ],
    { initialEntries: [initialEntry] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

async function rowAction(nutrient: string, action: string) {
  await userEvent.click(
    screen.getByRole('button', { name: `Actions for ${nutrient}` }),
  );
  await userEvent.click(screen.getByRole('menuitem', { name: action }));
}

beforeEach(() => {
  vi.clearAllMocks();
  hooks.useGetNutrientsQuery.mockReturnValue(queryState());
  hooks.useGetNutrientQuery.mockReturnValue({
    currentData: { ...zinc, name: 'Authoritative Zinc' },
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch,
  });
  create.mockReturnValue({ unwrap: () => Promise.resolve(zinc) });
  update.mockReturnValue({ unwrap: () => Promise.resolve(zinc) });
  deleteNutrient.mockReturnValue({ unwrap: () => Promise.resolve() });
  hooks.useCreateNutrientMutation.mockReturnValue([
    create,
    { isLoading: false, reset: vi.fn() },
  ]);
  hooks.useUpdateNutrientMutation.mockReturnValue([
    update,
    { isLoading: false, reset: vi.fn() },
  ]);
  hooks.useDeleteNutrientMutation.mockReturnValue([
    deleteNutrient,
    { isLoading: false, reset: vi.fn() },
  ]);
  // Radix Select's pointer/scroll APIs are not supplied by jsdom.
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.setPointerCapture = () => undefined;
  HTMLElement.prototype.releasePointerCapture = () => undefined;
  HTMLElement.prototype.scrollIntoView = () => undefined;
});

describe('NutrientsPage', () => {
  it('shows a full-collection overview from the current mock response', () => {
    renderPage('/admin/nutrients');

    const overview = screen.getByRole('region', {
      name: 'Nutrient overview',
    });
    expect(within(overview).getByText('Total nutrients')).toBeInTheDocument();
    expect(within(overview).getByText('30')).toBeInTheDocument();
    expect(within(overview).queryByText('Active')).not.toBeInTheDocument();
    expect(within(overview).queryByText('Inactive')).not.toBeInTheDocument();
    expect(hooks.useGetNutrientsQuery).toHaveBeenCalledTimes(1);
  });

  it('reads filters from the URL and requests the matching server page', () => {
    renderPage('/admin/nutrients?page=2&pageSize=25&unit=mg&isActive=false');
    expect(hooks.useGetNutrientsQuery).toHaveBeenCalledWith({
      page: 2,
      pageSize: 25,
      search: '',
      unit: 'mg',
      isActive: false,
    });
    expect(
      screen.getAllByRole('columnheader').map((cell) => cell.textContent),
    ).toEqual(['ID', 'Name', 'Unit', 'Ingredients', 'Actions']);
    expect(screen.getByText('30 nutrients')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="table-container"]')).toHaveClass(
      'overflow-x-auto',
    );
  });

  it('resets page to one when search changes', async () => {
    renderPage('/admin/nutrients?page=4');
    await userEvent.type(screen.getByRole('searchbox'), 'iron');
    expect(screen.getByRole('searchbox')).toHaveValue('iron');
    expect(screen.getByTestId('location-search')).toHaveTextContent(
      'search=iron',
    );
    expect(screen.getByTestId('location-search')).not.toHaveTextContent(
      'page=4',
    );
  });

  it('resets page when unit and page size change and retains other filters', async () => {
    renderPage('/admin/nutrients?page=3&search=iron');
    await userEvent.click(
      screen.getByRole('combobox', { name: 'Unit filter' }),
    );
    await userEvent.click(screen.getByRole('option', { name: 'mcg' }));
    expect(hooks.useGetNutrientsQuery).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 10,
      search: 'iron',
      unit: 'mcg',
    });
    await userEvent.click(
      screen.getByRole('combobox', { name: 'Rows per page' }),
    );
    await userEvent.click(screen.getByRole('option', { name: '25' }));
    expect(hooks.useGetNutrientsQuery).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 25,
      search: 'iron',
      unit: 'mcg',
    });
  });

  it('uses one-based server pagination without slicing the supplied rows', async () => {
    renderPage('/admin/nutrients');
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(hooks.useGetNutrientsQuery).toHaveBeenLastCalledWith({
      page: 2,
      pageSize: 10,
      search: '',
    });
    expect(screen.getByRole('cell', { name: 'Zinc' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByTestId('location-search')).toHaveTextContent('page=2');
  });

  it('reflects browser back navigation in controls and server requests', async () => {
    const router = renderPage('/admin/nutrients');
    await userEvent.type(screen.getByRole('searchbox'), 'a');
    await act(async () => {
      await router.navigate(-1);
    });
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(hooks.useGetNutrientsQuery).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 10,
      search: '',
    });
  });

  it('shows six skeleton columns and five rows during initial loading', () => {
    hooks.useGetNutrientsQuery.mockReturnValue(
      queryState({
        data: undefined,
        currentData: undefined,
        isLoading: true,
        isFetching: true,
      }),
    );
    renderPage('/admin/nutrients');
    const overview = screen.getByRole('region', {
      name: 'Nutrient overview',
    });
    expect(overview).toBeInTheDocument();
    expect(within(overview).getByText('Total nutrients')).toBeInTheDocument();
    expect(
      within(
        screen.getByRole('region', { name: 'Nutrient results' }),
      ).getByRole('status'),
    ).toHaveTextContent('Loading nutrients');
    expect(document.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      26,
    );
    expect(screen.getAllByRole('columnheader')).toHaveLength(5);
    expect(screen.queryByText('No nutrients yet')).not.toBeInTheDocument();
  });

  it('does not display a previous query page as matching a new URL while fetching', () => {
    hooks.useGetNutrientsQuery.mockReturnValue(
      queryState({ currentData: undefined, isFetching: true }),
    );
    renderPage('/admin/nutrients?search=missing');
    expect(
      within(
        screen.getByRole('region', { name: 'Nutrient results' }),
      ).getByRole('status'),
    ).toHaveTextContent('Loading nutrients');
    expect(
      screen.queryByRole('cell', { name: 'Zinc' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('30 nutrients')).not.toBeInTheDocument();
  });

  it('keeps current rows visible and announces background refreshing', () => {
    hooks.useGetNutrientsQuery.mockReturnValue(
      queryState({ isFetching: true }),
    );
    renderPage('/admin/nutrients');
    expect(
      within(
        screen.getByRole('region', { name: 'Nutrient results' }),
      ).getByRole('status'),
    ).toHaveTextContent('Refreshing nutrients');
    expect(screen.getByRole('cell', { name: 'Zinc' })).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Nutrient results' }),
    ).toHaveAttribute('aria-busy', 'true');
  });

  it('offers creation for an unfiltered empty collection', async () => {
    const empty = { ...result, items: [], total: 0 };
    hooks.useGetNutrientsQuery.mockReturnValue(
      queryState({ data: empty, currentData: empty }),
    );
    renderPage('/admin/nutrients');
    expect(screen.getByText('No nutrients yet')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="empty"]')).toBeInTheDocument();
    await userEvent.click(
      screen.getAllByRole('button', { name: 'Add nutrient' })[1],
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Create nutrient');
  });

  it('offers clear filters for no matching results', async () => {
    const empty = { ...result, items: [], total: 0 };
    hooks.useGetNutrientsQuery.mockReturnValue(
      queryState({ data: empty, currentData: empty }),
    );
    renderPage('/admin/nutrients?page=3&pageSize=25&search=none&unit=IU');
    expect(screen.getByText('No matching nutrients')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Clear filters' }),
    );
    expect(hooks.useGetNutrientsQuery).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 25,
      search: '',
    });
  });

  it('makes active filters visible and clears them from the toolbar', async () => {
    renderPage('/admin/nutrients?search=iron&unit=mg');

    const activeFilters = screen.getByRole('region', {
      name: 'Active nutrient filters',
    });
    expect(within(activeFilters).getByText('Search: iron')).toBeInTheDocument();
    expect(within(activeFilters).getByText('Unit: mg')).toBeInTheDocument();

    await userEvent.click(
      within(activeFilters).getByRole('button', { name: 'Clear filters' }),
    );
    expect(hooks.useGetNutrientsQuery).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 10,
      search: '',
    });
  });

  it('shows an alert and retries failed requests without showing an empty success state', async () => {
    hooks.useGetNutrientsQuery.mockReturnValue(
      queryState({
        data: undefined,
        currentData: undefined,
        isError: true,
        error: { message: 'Nutrients unavailable.' },
      }),
    );
    renderPage('/admin/nutrients');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Nutrients unavailable.',
    );
    expect(screen.queryByText('No nutrients yet')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('retains current rows while displaying a background refetch error', () => {
    hooks.useGetNutrientsQuery.mockReturnValue(
      queryState({ isError: true, error: { message: 'Refresh failed.' } }),
    );
    renderPage('/admin/nutrients');
    expect(screen.getByRole('alert')).toHaveTextContent('Refresh failed.');
    expect(screen.getByRole('cell', { name: 'Zinc' })).toBeInTheDocument();
  });

  it('prevents working delete for a used nutrient and requires confirmation for unused deletion', async () => {
    renderPage('/admin/nutrients');
    await userEvent.click(
      screen.getByRole('button', { name: 'Actions for Iron' }),
    );
    const blocked = screen.getByRole('menuitem', { name: 'Delete' });
    expect(blocked).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(blocked);
    expect(deleteNutrient).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    await rowAction('Zinc', 'Delete');
    expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription(
      /cannot be undone/i,
    );
    expect(deleteNutrient).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('keeps a row visible and shows a conflict message after delete returns 409', async () => {
    deleteNutrient.mockReturnValue({
      unwrap: () =>
        Promise.reject({ status: 409, message: 'Nutrient is in use.' }),
    });
    renderPage('/admin/nutrients');
    await rowAction('Zinc', 'Delete');
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete permanently' }),
    );
    expect(
      await screen.findByText(
        'This nutrient is now used by an ingredient. Deactivate it instead.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('cell', { name: 'Zinc', hidden: true }),
    ).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(hooks.success).not.toHaveBeenCalled();
  });

  it('awaits delete before success notification and dialog close without optimistic row removal', async () => {
    let resolve: (() => void) | undefined;
    deleteNutrient.mockReturnValue({
      unwrap: () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    });
    renderPage('/admin/nutrients');
    await rowAction('Zinc', 'Delete');
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete permanently' }),
    );
    expect(deleteNutrient).toHaveBeenCalledWith(2);
    expect(
      screen.getByRole('button', { name: 'Delete permanently' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('cell', { name: 'Zinc', hidden: true }),
    ).toBeInTheDocument();
    expect(hooks.success).not.toHaveBeenCalled();
    await act(async () => resolve?.());
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(hooks.success).toHaveBeenCalledWith('Nutrient deleted.');
    await userEvent.click(screen.getByRole('button', { name: 'Add nutrient' }));
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Create nutrient');
  });

  it('creates a nutrient through the form and closes only after success', async () => {
    renderPage('/admin/nutrients');
    await userEvent.click(screen.getByRole('button', { name: 'Add nutrient' }));
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Name' }),
      'Calcium',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Create nutrient' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(create).toHaveBeenCalledWith({ name: 'Calcium', unit: 'g' });
    expect(hooks.success).toHaveBeenCalledWith('Nutrient created.');
  });

  it('edits the selected nutrient without a status field', async () => {
    renderPage('/admin/nutrients');
    await rowAction('Zinc', 'Edit');
    const name = screen.getByRole('textbox', { name: 'Name' });
    expect(name).toHaveValue('Zinc');
    await userEvent.clear(name);
    await userEvent.type(name, 'Updated Zinc');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(update).toHaveBeenCalledWith({
      id: 2,
      name: 'Updated Zinc',
      unit: 'mg',
    });
    expect(hooks.success).toHaveBeenCalledWith('Nutrient updated.');
  });

  it('preserves form values and server field errors after failed creation', async () => {
    create.mockReturnValue({
      unwrap: () =>
        Promise.reject({ fieldErrors: { name: 'Name already exists.' } }),
    });
    renderPage('/admin/nutrients');
    await userEvent.click(screen.getByRole('button', { name: 'Add nutrient' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Zinc');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create nutrient' }),
    );
    expect(await screen.findByText('Name already exists.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Zinc');
    expect(hooks.success).not.toHaveBeenCalled();
  });

  it('opens authoritative nutrient details for the selected row', async () => {
    renderPage('/admin/nutrients');
    await rowAction('Zinc', 'View details');
    expect(hooks.useGetNutrientQuery).toHaveBeenLastCalledWith(2, {
      skip: false,
    });
    expect(
      within(screen.getByRole('dialog')).getByText('Authoritative Zinc'),
    ).toBeInTheDocument();
  });

  it('keeps delete confirmation open but prevents deletion when refreshed usage becomes positive', async () => {
    const router = renderPage('/admin/nutrients');
    await rowAction('Zinc', 'Delete');
    const refreshed = {
      ...result,
      items: [iron, { ...zinc, ingredientCount: 1 }],
    };
    hooks.useGetNutrientsQuery.mockReturnValue(
      queryState({ data: refreshed, currentData: refreshed }),
    );
    await act(async () => {
      await router.navigate('/admin/nutrients');
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete permanently' }),
    );
    expect(
      await screen.findByText(
        'This nutrient is now used by an ingredient. Deactivate it instead.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(deleteNutrient).not.toHaveBeenCalled();
  });

  it('allows another page interaction after an explicitly cancelled confirmation', async () => {
    renderPage('/admin/nutrients');
    await rowAction('Zinc', 'Delete');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add nutrient' }));
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Create nutrient');
  });

  it('supports keyboard menu navigation and modal confirmation focus', async () => {
    renderPage('/admin/nutrients');
    const trigger = screen.getByRole('button', { name: 'Actions for Zinc' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{End}{Enter}');
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName(
      'Delete Zinc permanently?',
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await userEvent.keyboard('{Tab}');
    expect(
      screen.getByRole('button', { name: 'Delete permanently' }),
    ).toHaveFocus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}{Enter}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(deleteNutrient).not.toHaveBeenCalled();
  });

  it('retains pagination recovery after deleting the last item on page two while earlier records remain', async () => {
    const secondPage = { items: [zinc], total: 11, page: 2, pageSize: 10 };
    hooks.useGetNutrientsQuery.mockReturnValue(
      queryState({ data: secondPage, currentData: secondPage }),
    );
    const router = renderPage('/admin/nutrients?page=2');
    await rowAction('Zinc', 'Delete');
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete permanently' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(deleteNutrient).toHaveBeenCalledWith(2);
    expect(hooks.success).toHaveBeenCalledWith('Nutrient deleted.');

    const refreshed = { items: [], total: 10, page: 2, pageSize: 10 };
    hooks.useGetNutrientsQuery.mockReturnValue(
      queryState({ data: refreshed, currentData: refreshed }),
    );
    await act(async () => {
      await router.navigate('/admin/nutrients?page=2');
    });
    expect(screen.getByText('10 nutrients')).toBeInTheDocument();
    expect(screen.queryByText('No nutrients yet')).not.toBeInTheDocument();
    expect(screen.queryByText('No matching nutrients')).not.toBeInTheDocument();
    expect(
      screen.getByRole('cell', { name: 'No nutrients on this page.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Rows per page' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(hooks.useGetNutrientsQuery).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 10,
      search: '',
    });
    expect(screen.getByTestId('location-search')).not.toHaveTextContent(
      'page=2',
    );
  });

  it('retains pagination rather than no-results when the filtered requested page is empty but matching records remain', async () => {
    const emptyPage = { items: [], total: 10, page: 2, pageSize: 10 };
    hooks.useGetNutrientsQuery.mockReturnValue(
      queryState({ data: emptyPage, currentData: emptyPage }),
    );
    renderPage('/admin/nutrients?page=2&unit=mg&isActive=false');
    expect(screen.queryByText('No matching nutrients')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Clear filters' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(hooks.useGetNutrientsQuery).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 10,
      search: '',
      unit: 'mg',
      isActive: false,
    });
  });
});
