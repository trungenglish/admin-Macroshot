import {
  ChartNoAxesCombinedIcon,
  DatabaseIcon,
  UtensilsIcon,
} from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { IngredientSummary } from '../ingredient.types';

interface IngredientSummaryCardsProps {
  summary?: IngredientSummary;
  loading?: boolean;
}

const summaryItems = [
  {
    key: 'total' as const,
    label: 'Total ingredients',
    description: 'Across the system catalog',
    icon: DatabaseIcon,
  },
  {
    key: 'inUse' as const,
    label: 'Used in recipes',
    description: 'Protected from deletion',
    icon: UtensilsIcon,
  },
  {
    key: 'withNutrientData' as const,
    label: 'Micronutrient profiles',
    description: 'Linked to nutrient details',
    icon: ChartNoAxesCombinedIcon,
  },
];

export function IngredientSummaryCards({
  summary,
  loading = false,
}: IngredientSummaryCardsProps): React.JSX.Element {
  const nutrientCoverage =
    summary && summary.total > 0
      ? Math.round((summary.withNutrientData / summary.total) * 100)
      : 0;

  return (
    <section
      aria-label='Ingredient overview'
      aria-busy={loading}
    >
      <div className='grid overflow-hidden rounded-xl border bg-card sm:grid-cols-3'>
        {summaryItems.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.key}
              className='flex flex-col gap-3 border-b py-4 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0'
            >
              <div className='grid grid-cols-[1fr_auto] gap-1 px-4 sm:px-5'>
                <h2
                  role='heading'
                  aria-level={2}
                  className='text-sm font-medium text-muted-foreground'
                >
                  {item.label}
                </h2>
                <div className='row-span-2 rounded-md bg-primary/8 p-2 text-primary'>
                  <Icon aria-hidden='true' />
                </div>
              </div>
              <div className='px-4 sm:px-5'>
                {loading ? (
                  <Skeleton className='h-9 w-20' />
                ) : summary ? (
                  <p className='text-2xl font-semibold tracking-tight tabular-nums'>
                    {summary[item.key]}
                  </p>
                ) : (
                  <p className='text-2xl font-semibold tracking-tight text-muted-foreground'>
                    —
                  </p>
                )}
              </div>
              <div className='mt-auto min-h-5 px-4 text-xs text-muted-foreground sm:px-5'>
                {item.key === 'total' && summary && !loading ? (
                  <div className='flex w-full flex-col gap-2'>
                    <div className='flex items-center justify-between gap-3'>
                      <span>Nutrient coverage</span>
                      <span className='font-medium text-foreground tabular-nums'>
                        {nutrientCoverage}%
                      </span>
                    </div>
                    <Progress
                      value={nutrientCoverage}
                      aria-label='Ingredient nutrient coverage'
                    />
                  </div>
                ) : (
                  <span title={item.description}>
                    {loading
                      ? 'Loading overview…'
                      : !summary
                        ? 'Overview unavailable'
                        : item.key === 'inUse'
                          ? `${summary.unknownRecipeUsage} record${summary.unknownRecipeUsage === 1 ? '' : 's'} needs usage review`
                          : `${summary.withNutrientData} of ${summary.total} ingredients`}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
