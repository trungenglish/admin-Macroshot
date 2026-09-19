import type { Ingredient } from '../ingredient.types';
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
import {
  getIngredientDeletePolicy,
  isSystemIngredient,
} from '../ingredient-policy';

interface Props {
  ingredient: Ingredient;
  onView(ingredient: Ingredient): void;
  onEdit(ingredient: Ingredient): void;
  onDelete(ingredient: Ingredient): void;
}

export function IngredientRowActions({
  ingredient,
  onView,
  onEdit,
  onDelete,
}: Props): React.JSX.Element {
  const policy = getIngredientDeletePolicy(ingredient);
  const system = isSystemIngredient(ingredient);
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          aria-label={`Actions for ${ingredient.name}`}
        >
          <MoreHorizontalIcon
            aria-hidden='true'
            data-icon='inline-start'
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuGroup>
          <DropdownMenuItem
            disabled={!system}
            onSelect={() => {
              if (system) onView(ingredient);
            }}
          >
            View details
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!system}
            aria-disabled={!system}
            onSelect={() => {
              if (system) onEdit(ingredient);
            }}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!policy.canDelete}
            aria-disabled={!policy.canDelete}
            variant={policy.canDelete ? 'destructive' : 'default'}
            onSelect={() => {
              if (policy.canDelete) onDelete(ingredient);
            }}
          >
            Delete
          </DropdownMenuItem>
          {policy.reason && (
            <DropdownMenuLabel className='max-w-72 whitespace-normal'>
              {policy.reason}
            </DropdownMenuLabel>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
