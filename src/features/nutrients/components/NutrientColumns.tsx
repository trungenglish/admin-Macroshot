import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import type { Nutrient } from '../nutrient.types';
import { NutrientRowActions } from './NutrientRowActions';

interface NutrientColumnActions {
  onView(nutrient: Nutrient): void;
  onEdit(nutrient: Nutrient): void;
  onDelete(nutrient: Nutrient): void;
}

export function createNutrientColumns(
  actions: NutrientColumnActions,
): ColumnDef<Nutrient>[] {
  return [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <span className='font-mono text-xs text-muted-foreground'>
          {row.original.id}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span
          className='block max-w-48 truncate font-medium text-foreground sm:max-w-72'
          title={row.original.name}
        >
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: 'unit',
      header: 'Unit',
      cell: ({ row }) => <Badge variant='outline'>{row.original.unit}</Badge>,
    },
    {
      accessorKey: 'ingredientCount',
      header: 'Ingredients',
      cell: ({ row }) => (
        <span className='text-muted-foreground tabular-nums'>
          {row.original.ingredientCount === 0
            ? 'Not in use'
            : `${row.original.ingredientCount} linked`}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <div className='text-right'>Actions</div>,
      cell: ({ row }) => (
        <div className='flex justify-end'>
          <NutrientRowActions
            nutrient={row.original}
            {...actions}
          />
        </div>
      ),
    },
  ];
}
