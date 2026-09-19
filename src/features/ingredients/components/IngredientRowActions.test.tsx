import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { previewIngredientTransport as preview } from '../dev/ingredients-preview';
import { IngredientRowActions } from './IngredientRowActions';

afterEach(cleanup);
describe('IngredientRowActions', () => {
  // Break caught: unknown usage or personal ownership enables a destructive menu action.
  it.each([
    {
      recipeCount: null,
      reason: 'Recipe usage is unavailable. Deletion is disabled.',
    },
    {
      recipeCount: 2,
      reason: 'This ingredient is used by a recipe and cannot be deleted.',
    },
    {
      recipeCount: 0,
      isSystem: false,
      userId: 42,
      reason: 'Only system ingredients can be deleted.',
    },
  ])('fails closed for $reason', async ({ reason, ...changes }) => {
    const onDelete = vi.fn();
    render(
      <IngredientRowActions
        ingredient={{ ...(await preview.detail(1)), ...changes }}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Actions for Tomatoes' }),
    );
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByText(reason)).toBeVisible();
    expect(onDelete).not.toHaveBeenCalled();
    if (changes.isSystem === false)
      expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
  });
  it('dispatches the safe selected record', async () => {
    const ingredient = await preview.detail(1);
    const onDelete = vi.fn();
    render(
      <IngredientRowActions
        ingredient={ingredient}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Actions for Tomatoes' }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith(ingredient);
  });
});
