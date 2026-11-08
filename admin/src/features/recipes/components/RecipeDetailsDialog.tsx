import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import {
  ContentLanguagePicker,
  MissingLanguagePanel,
} from '@/shared/components/LanguageCoverage';
import { CONTENT_LANGUAGE_LABELS } from '@/shared/languages/content-language';
import type { ContentLanguage } from '@/shared/languages/content-language';
import { useGetRecipeQuery, type RecipesApiError } from '../api/recipes-api';
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
  const [selection, setSelection] = useState<{
    recipeId: number | null;
    language: ContentLanguage;
  }>({ recipeId: null, language: 'vi' });
  const language =
    recipe && selection.recipeId === recipe.id ? selection.language : 'vi';
  const isAvailable = recipe?.availableLanguages?.includes(language) ?? false;
  const {
    currentData: translatedRecipe,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetRecipeQuery(
    { id: recipe?.id ?? 0, language },
    { skip: !recipe || !isAvailable },
  );

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
                Read-only translation inspection · Nutrition per 100 g
              </DialogDescription>
            </DialogHeader>
            <section className='flex flex-col gap-3'>
              <div className='flex flex-col gap-1'>
                <h3 className='text-sm font-semibold'>Content language</h3>
                <p className='text-xs text-muted-foreground'>
                  Select a language to check its translation.
                </p>
              </div>
              <ContentLanguagePicker
                availableLanguages={recipe.availableLanguages}
                value={language}
                onChange={(nextLanguage) =>
                  setSelection({ recipeId: recipe.id, language: nextLanguage })
                }
              />
              {isAvailable ? (
                isError && !translatedRecipe ? (
                  <Alert variant='destructive'>
                    <AlertTitle>Unable to load translation</AlertTitle>
                    <AlertDescription>
                      {(error as RecipesApiError)?.message ??
                        'Unable to complete the request. Please try again.'}
                      <Button
                        variant='outline'
                        disabled={isFetching}
                        onClick={() => void refetch()}
                      >
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : isLoading || !translatedRecipe ? (
                  <div
                    role='status'
                    className='rounded-lg border border-dashed px-5 py-8 text-center text-sm text-muted-foreground'
                  >
                    Loading {CONTENT_LANGUAGE_LABELS[language]} translation…
                  </div>
                ) : (
                  <div className='flex flex-col gap-5 rounded-lg border p-4'>
                    <div className='flex flex-wrap items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <p className='text-xs text-muted-foreground'>
                          {CONTENT_LANGUAGE_LABELS[language]} content · Read
                          only
                        </p>
                        <h2 className='mt-1 break-words text-lg font-semibold'>
                          {translatedRecipe.name}
                        </h2>
                      </div>
                      <Badge variant='outline'>Available</Badge>
                    </div>
                    {isFetching && (
                      <p
                        role='status'
                        className='text-xs text-muted-foreground'
                      >
                        Refreshing translation…
                      </p>
                    )}
                    {translatedRecipe.imageUrl && (
                      <img
                        src={translatedRecipe.imageUrl}
                        alt={translatedRecipe.name}
                        className='h-48 w-full rounded-lg border bg-muted/20 object-cover'
                      />
                    )}
                    <dl className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
                      {[
                        [
                          'Calories',
                          `${numberFormat.format(translatedRecipe.calPer100g)} kcal`,
                        ],
                        [
                          'Protein',
                          `${numberFormat.format(translatedRecipe.proPer100g)} g`,
                        ],
                        [
                          'Carbs',
                          `${numberFormat.format(translatedRecipe.carbPer100g)} g`,
                        ],
                        [
                          'Fat',
                          `${numberFormat.format(translatedRecipe.fatPer100g)} g`,
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className='rounded-lg border bg-muted/20 p-3'
                        >
                          <dt className='text-xs text-muted-foreground'>
                            {label}
                          </dt>
                          <dd className='mt-1 text-sm font-semibold'>
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <section className='flex flex-col gap-2'>
                      <h3 className='text-sm font-semibold'>Ingredients</h3>
                      {translatedRecipe.ingredients.length ? (
                        <ul className='divide-y rounded-lg border'>
                          {translatedRecipe.ingredients.map((ingredient) => (
                            <li
                              key={ingredient.id}
                              className='flex items-center justify-between gap-3 px-3 py-2.5 text-sm'
                            >
                              <span className='min-w-0 break-words'>
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
                      {translatedRecipe.portions.length ? (
                        <div className='flex flex-wrap gap-2'>
                          {translatedRecipe.portions.map((portion, index) => (
                            <Badge
                              key={`${portion.unitName}-${index}`}
                              variant={
                                portion.isDefault ? 'secondary' : 'outline'
                              }
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
                )
              ) : (
                <MissingLanguagePanel language={language} />
              )}
            </section>
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
