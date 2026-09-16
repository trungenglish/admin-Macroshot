import { MoreHorizontalIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getNutrientActionPolicy } from '../nutrient-policy';
import type { Nutrient } from '../nutrient.types';

interface NutrientRowActionsProps {
  nutrient: Nutrient;
  onView(nutrient: Nutrient): void;
  onEdit(nutrient: Nutrient): void;
  onToggleStatus(nutrient: Nutrient): void;
  onDelete(nutrient: Nutrient): void;
}

export function NutrientRowActions({
  nutrient,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: NutrientRowActionsProps) {
  const { statusAction, canDelete } = getNutrientActionPolicy(nutrient);
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          aria-label={`Actions for ${nutrient.name}`}
        >
          <MoreHorizontalIcon
            aria-hidden='true'
            data-icon='inline-start'
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => onView(nutrient)}>
            View details
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onEdit(nutrient)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onToggleStatus(nutrient)}>
            {statusAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canDelete}
            aria-disabled={!canDelete}
            variant={canDelete ? 'destructive' : 'default'}
            onSelect={() => {
              if (canDelete) onDelete(nutrient);
            }}
          >
            Delete
          </DropdownMenuItem>
          {!canDelete && (
            <DropdownMenuLabel>
              Used by {nutrient.ingredientCount} ingredients. Deactivate it
              instead.
            </DropdownMenuLabel>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
