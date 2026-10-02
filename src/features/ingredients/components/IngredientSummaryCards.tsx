import {
  ChartNoAxesCombinedIcon,
  DatabaseIcon,
  UtensilsIcon,
} from 'lucide-react';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {summaryItems.map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.key}
              className='gap-4 py-5 shadow-xs'
            >
              <CardHeader className='gap-1'>
                <CardTitle
                  role='heading'
                  aria-level={2}
                  className='text-sm font-medium text-muted-foreground'
                >
                  {item.label}
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
                <CardAction className='rounded-lg bg-muted p-2 text-muted-foreground'>
                  <Icon aria-hidden='true' />
                </CardAction>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className='h-9 w-20' />
                ) : summary ? (
                  <p className='text-3xl font-semibold tracking-tight tabular-nums'>
                    {summary[item.key]}
                  </p>
                ) : (
                  <p className='text-3xl font-semibold tracking-tight text-muted-foreground'>
                    —
                  </p>
                )}
              </CardContent>
              <CardFooter className='min-h-6 text-xs text-muted-foreground'>
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
                  <span>
                    {loading
                      ? 'Loading overview…'
                      : !summary
                        ? 'Overview unavailable'
                        : item.key === 'inUse'
                          ? `${summary.unknownRecipeUsage} record${summary.unknownRecipeUsage === 1 ? '' : 's'} needs usage review`
                          : `${summary.withNutrientData} of ${summary.total} ingredients`}
                  </span>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
