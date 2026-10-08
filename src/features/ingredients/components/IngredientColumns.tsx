import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import type { Ingredient } from '../ingredient.types';
import { IngredientRowActions } from './IngredientRowActions';
import { NutritionValue, RecipeUsage } from './IngredientTableCells';

interface Actions {
  onView(ingredient: Ingredient): void;
  onEdit(ingredient: Ingredient): void;
  onDelete(ingredient: Ingredient): void;
}

export function createIngredientColumns(
  actions: Actions,
): ColumnDef<Ingredient>[] {
  return [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <span className='font-mono text-xs text-muted-foreground tabular-nums'>
          #{row.original.id}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className='font-medium'>{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'unit',
      header: 'Unit',
      cell: ({ row }) => <Badge variant='outline'>{row.original.unit}</Badge>,
    },
    {
      accessorKey: 'calPer100g',
      header: 'Calories',
      cell: ({ row }) => (
        <NutritionValue
          value={row.original.calPer100g}
          unit='kcal'
        />
      ),
    },
    {
      accessorKey: 'proPer100g',
      header: 'Protein',
      cell: ({ row }) => (
        <NutritionValue
          value={row.original.proPer100g}
          unit='g'
          tone='protein'
        />
      ),
    },
    {
      accessorKey: 'carbPer100g',
      header: 'Carbs',
      cell: ({ row }) => (
        <NutritionValue
          value={row.original.carbPer100g}
          unit='g'
          tone='carbs'
        />
      ),
    },
    {
      accessorKey: 'fatPer100g',
      header: 'Fat',
      cell: ({ row }) => (
        <NutritionValue
          value={row.original.fatPer100g}
          unit='g'
          tone='fat'
        />
      ),
    },
    {
      accessorKey: 'recipeCount',
      header: 'Recipe usage',
      cell: ({ row }) => <RecipeUsage count={row.original.recipeCount} />,
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
