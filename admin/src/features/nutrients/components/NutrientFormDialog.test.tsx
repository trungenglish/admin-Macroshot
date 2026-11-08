import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { NutrientFormDialog } from './NutrientFormDialog';

describe('NutrientFormDialog', () => {
  it('blocks a blank name before calling onSubmit', async () => {
    const onSubmit = vi.fn();
    render(
      <NutrientFormDialog
        mode='create'
        nutrient={null}
        open
        onOpenChange={() => undefined}
        onSubmit={onSubmit}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Create nutrient' }),
    );
    expect(
      await screen.findByText('Enter a nutrient name.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('resets edit values whenever the selected nutrient changes', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    const iron = {
      id: 1,
      name: 'Iron',
      unit: 'mg' as const,
      isActive: true,
      ingredientCount: 2,
    };
    const vitaminC = {
      id: 2,
      name: 'Vitamin C',
      unit: 'mg' as const,
      isActive: true,
      ingredientCount: 4,
    };
    const { rerender } = render(
      <NutrientFormDialog
        mode='edit'
        nutrient={iron}
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );
    rerender(
      <NutrientFormDialog
        mode='edit'
        nutrient={vitaminC}
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByLabelText('Name')).toHaveValue('Vitamin C');
  });

  it('disables submission while the create request is pending', async () => {
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const onOpenChange = vi.fn();
    render(
      <NutrientFormDialog
        mode='create'
        nutrient={null}
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );
    await userEvent.type(screen.getByLabelText('Name'), 'Iron');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create nutrient' }),
    );
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Create nutrient' }),
      ).toBeDisabled();
    });
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
    expect(
      screen
        .getByRole('button', { name: 'Create nutrient' })
        .querySelector('svg'),
    ).toHaveAttribute('data-icon', 'inline-start');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await userEvent.keyboard('{Escape}');
    fireEvent.pointerDown(
      document.querySelector('[data-slot="dialog-overlay"]')!,
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveSubmit?.();
    });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(screen.getByLabelText('Name')).toHaveValue('');
  });

  it('maps a server name error back to the name field', async () => {
    const onSubmit = vi.fn().mockRejectedValue({
      status: 422,
      message: 'Check the highlighted fields.',
      fieldErrors: { name: 'Name already exists.' },
    });
    render(
      <NutrientFormDialog
        mode='create'
        nutrient={null}
        open
        onOpenChange={() => undefined}
        onSubmit={onSubmit}
      />,
    );
    await userEvent.type(screen.getByLabelText('Name'), 'Iron');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create nutrient' }),
    );
    expect(await screen.findByText('Name already exists.')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('maps a server unit error back to the unit control without closing', async () => {
    const onOpenChange = vi.fn();
    render(
      <NutrientFormDialog
        mode='create'
        nutrient={null}
        open
        onOpenChange={onOpenChange}
        onSubmit={vi.fn().mockRejectedValue({
          status: 422,
          message: 'Check the highlighted fields.',
          fieldErrors: { unit: 'This nutrient requires mg.' },
        })}
      />,
    );
    await userEvent.type(screen.getByLabelText('Name'), 'Iron');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create nutrient' }),
    );
    expect(
      await screen.findByText('This nutrient requires mg.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Unit')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(
      screen.getByLabelText('Unit').closest('[data-slot="field"]'),
    ).toHaveAttribute('data-invalid', 'true');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('renders one alert for a non-field request error and permits retry', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue({ status: 500, message: 'Try again later.' });
    const onOpenChange = vi.fn();
    render(
      <NutrientFormDialog
        mode='create'
        nutrient={null}
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );
    await userEvent.type(screen.getByLabelText('Name'), 'Iron');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create nutrient' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Try again later.',
    );
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: 'Create nutrient' }),
    ).toBeEnabled();
    expect(screen.getByLabelText('Name')).toHaveValue('Iron');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('submits trimmed edit values with the selected unit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    render(
      <NutrientFormDialog
        mode='edit'
        nutrient={{
          id: 1,
          name: 'Iron',
          unit: 'mg',
          isActive: true,
          ingredientCount: 2,
        }}
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );
    await userEvent.clear(screen.getByLabelText('Name'));
    await userEvent.type(screen.getByLabelText('Name'), '  Vitamin C  ');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Vitamin C', unit: 'mg' });
  });

  it('resets the unit and name when changing from edit to create', () => {
    const props = {
      onOpenChange: vi.fn(),
      onSubmit: vi.fn().mockResolvedValue(undefined),
    };
    const { rerender } = render(
      <NutrientFormDialog
        {...props}
        mode='edit'
        nutrient={{
          id: 3,
          name: 'Vitamin D',
          unit: 'IU',
          isActive: true,
          ingredientCount: 1,
        }}
        open
      />,
    );
    expect(screen.getByLabelText('Unit')).toHaveTextContent('IU');
    rerender(
      <NutrientFormDialog
        {...props}
        mode='create'
        nutrient={null}
        open
      />,
    );
    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(screen.getByLabelText('Unit')).toHaveTextContent('g');
  });

  it('clears stale create values and request errors on reopening', async () => {
    const props = {
      mode: 'create' as const,
      nutrient: null,
      onOpenChange: vi.fn(),
      onSubmit: vi.fn().mockRejectedValue({ message: 'Try again later.' }),
    };
    const { rerender } = render(
      <NutrientFormDialog
        {...props}
        open
      />,
    );
    await userEvent.type(screen.getByLabelText('Name'), 'Iron');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create nutrient' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Try again later.',
    );
    rerender(
      <NutrientFormDialog
        {...props}
        open={false}
      />,
    );
    rerender(
      <NutrientFormDialog
        {...props}
        open
      />,
    );
    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
