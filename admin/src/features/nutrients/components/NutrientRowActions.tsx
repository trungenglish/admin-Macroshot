import {
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';

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
  onDelete(nutrient: Nutrient): void;
}

export function NutrientRowActions({
  nutrient,
  onView,
  onEdit,
  onDelete,
}: NutrientRowActionsProps) {
  const { canDelete } = getNutrientActionPolicy(nutrient);
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          aria-label={`Actions for ${nutrient.name}`}
          className='hover:bg-muted data-[state=open]:bg-muted'
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
            <EyeIcon
              aria-hidden='true'
              data-icon='view'
            />
            View details
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onEdit(nutrient)}>
            <PencilIcon
              aria-hidden='true'
              data-icon='edit'
            />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canDelete}
            aria-disabled={!canDelete}
            variant={canDelete ? 'destructive' : 'default'}
            onSelect={() => {
              if (canDelete) onDelete(nutrient);
            }}
          >
            <Trash2Icon
              aria-hidden='true'
              data-icon='delete'
            />
            Delete
          </DropdownMenuItem>
          {!canDelete && (
            <DropdownMenuLabel className='max-w-72 whitespace-normal'>
              Used by {nutrient.ingredientCount} ingredients and cannot be
              deleted.
            </DropdownMenuLabel>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
