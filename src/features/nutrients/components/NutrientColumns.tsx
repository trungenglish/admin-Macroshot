import type { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import type { Nutrient } from '../nutrient.types';
import { NutrientRowActions } from './NutrientRowActions';

interface NutrientColumnActions {
  onView(nutrient: Nutrient): void;
  onEdit(nutrient: Nutrient): void;
  onToggleStatus(nutrient: Nutrient): void;
  onDelete(nutrient: Nutrient): void;
}

export function createNutrientColumns(
  actions: NutrientColumnActions,
): ColumnDef<Nutrient>[] {
  return [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'unit', header: 'Unit' },
    { accessorKey: 'ingredientCount', header: 'Ingredients' },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <NutrientRowActions
          nutrient={row.original}
          {...actions}
        />
      ),
    },
  ];
}
