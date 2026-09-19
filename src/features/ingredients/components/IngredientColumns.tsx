import type { ColumnDef } from '@tanstack/react-table';
import type { Ingredient } from '../ingredient.types';
import { IngredientRowActions } from './IngredientRowActions';

interface Actions {
  onView(ingredient: Ingredient): void;
  onEdit(ingredient: Ingredient): void;
  onDelete(ingredient: Ingredient): void;
}

export function createIngredientColumns(
  actions: Actions,
): ColumnDef<Ingredient>[] {
  return [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'unit', header: 'Unit' },
    {
      accessorKey: 'calPer100g',
      header: 'Calories',
      cell: ({ row }) => `${row.original.calPer100g} kcal / 100g`,
    },
    {
      accessorKey: 'proPer100g',
      header: 'Protein',
      cell: ({ row }) => `${row.original.proPer100g} g / 100g`,
    },
    {
      accessorKey: 'carbPer100g',
      header: 'Carbs',
      cell: ({ row }) => `${row.original.carbPer100g} g / 100g`,
    },
    {
      accessorKey: 'fatPer100g',
      header: 'Fat',
      cell: ({ row }) => `${row.original.fatPer100g} g / 100g`,
    },
    {
      accessorKey: 'recipeCount',
      header: 'Recipe usage',
      cell: ({ row }) => row.original.recipeCount ?? 'Unknown',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <IngredientRowActions
          ingredient={row.original}
          {...actions}
        />
      ),
    },
  ];
}
