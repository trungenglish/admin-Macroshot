import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Recipe } from '../recipe.types';

const numberFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
});

export function RecipeDetailsDialog({
  recipe,
  onClose,
}: {
  recipe: Recipe | null;
  onClose(): void;
}): React.JSX.Element {
  return (
    <Dialog
      open={recipe !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
        {recipe && (
          <>
            <DialogHeader>
              <DialogTitle className='pr-6'>{recipe.name}</DialogTitle>
              <DialogDescription>
                Nutrition per 100 g · {numberFormat.format(recipe.gramWeight)} g
                total recipe weight
              </DialogDescription>
            </DialogHeader>
            <div className='flex flex-col gap-5'>
              {recipe.imageUrl && (
                <img
                  src={recipe.imageUrl}
                  alt={recipe.name}
                  className='h-48 w-full rounded-lg border bg-muted/20 object-cover'
                />
              )}
              <dl className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
                {[
                  [
                    'Calories',
                    `${numberFormat.format(recipe.calPer100g)} kcal`,
                  ],
                  ['Protein', `${numberFormat.format(recipe.proPer100g)} g`],
                  ['Carbs', `${numberFormat.format(recipe.carbPer100g)} g`],
                  ['Fat', `${numberFormat.format(recipe.fatPer100g)} g`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className='rounded-lg border bg-muted/20 p-3'
                  >
                    <dt className='text-xs text-muted-foreground'>{label}</dt>
                    <dd className='mt-1 text-sm font-semibold'>{value}</dd>
                  </div>
                ))}
              </dl>
              <section className='flex flex-col gap-2'>
                <h3 className='text-sm font-semibold'>Ingredients</h3>
                {recipe.ingredients.length ? (
                  <ul className='divide-y rounded-lg border'>
                    {recipe.ingredients.map((ingredient) => (
                      <li
                        key={ingredient.id}
                        className='flex items-center justify-between gap-3 px-3 py-2.5 text-sm'
                      >
                        <span className='min-w-0 truncate'>
                          {ingredient.name}
                        </span>
                        <span className='shrink-0 text-muted-foreground'>
                          {numberFormat.format(ingredient.quantity)} g
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className='text-sm text-muted-foreground'>
                    No ingredient details available.
                  </p>
                )}
              </section>
              <section className='flex flex-col gap-2'>
                <h3 className='text-sm font-semibold'>Portions</h3>
                {recipe.portions.length ? (
                  <div className='flex flex-wrap gap-2'>
                    {recipe.portions.map((portion, index) => (
                      <Badge
                        key={`${portion.unitName}-${index}`}
                        variant={portion.isDefault ? 'secondary' : 'outline'}
                      >
                        {portion.unitName} ·{' '}
                        {numberFormat.format(portion.gramWeight)}g
                        {portion.isDefault ? ' · Default' : ''}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className='text-sm text-muted-foreground'>
                    No portion options available.
                  </p>
                )}
              </section>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={onClose}
              >
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
