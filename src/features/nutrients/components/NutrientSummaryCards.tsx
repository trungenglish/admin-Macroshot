import { FlaskConicalIcon } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import type { NutrientSummary } from '../nutrient.types';

interface NutrientSummaryCardsProps {
  summary?: NutrientSummary;
  loading?: boolean;
}

export function NutrientSummaryCards({
  summary,
  loading = false,
}: NutrientSummaryCardsProps) {
  return (
    <section
      aria-label='Nutrient overview'
      aria-busy={loading}
    >
      <article className='flex items-center justify-between gap-4 rounded-xl border bg-card px-4 py-4 sm:px-5'>
        <div>
          <h2 className='text-sm font-medium text-muted-foreground'>
            Total nutrients
          </h2>
          {loading ? (
            <Skeleton className='mt-2 h-8 w-20' />
          ) : (
            <p className='mt-2 text-2xl font-semibold tracking-tight tabular-nums'>
              {summary?.total ?? '—'}
            </p>
          )}
        </div>
        <div className='rounded-md bg-primary/8 p-2 text-primary'>
          <FlaskConicalIcon aria-hidden='true' />
        </div>
      </article>
    </section>
  );
}
