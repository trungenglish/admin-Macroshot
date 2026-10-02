import {
  CircleCheckIcon,
  CirclePauseIcon,
  FlaskConicalIcon,
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
import type { NutrientSummary } from '../nutrient.types';

interface NutrientSummaryCardsProps {
  summary?: NutrientSummary;
  loading?: boolean;
}

const summaryItems = [
  {
    key: 'total' as const,
    label: 'Total nutrients',
    description: 'Across the complete catalog',
    icon: FlaskConicalIcon,
  },
  {
    key: 'active' as const,
    label: 'Active',
    description: 'Available for associations',
    icon: CircleCheckIcon,
  },
  {
    key: 'inactive' as const,
    label: 'Inactive',
    description: 'Excluded from new associations',
    icon: CirclePauseIcon,
  },
];

export function NutrientSummaryCards({
  summary,
  loading = false,
}: NutrientSummaryCardsProps) {
  const activeRatio =
    summary && summary.total > 0
      ? Math.round((summary.active / summary.total) * 100)
      : 0;

  return (
    <section
      aria-label='Nutrient overview'
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
                <CardTitle className='text-sm font-medium text-muted-foreground'>
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
                  <div className='w-full space-y-2'>
                    <div className='flex items-center justify-between gap-3'>
                      <span>Active coverage</span>
                      <span className='font-medium text-foreground tabular-nums'>
                        {activeRatio}%
                      </span>
                    </div>
                    <Progress
                      value={activeRatio}
                      aria-label='Active nutrient ratio'
                    />
                  </div>
                ) : (
                  <span>
                    {loading
                      ? 'Loading overview…'
                      : !summary
                        ? 'Overview unavailable'
                        : item.key === 'active'
                          ? 'Ready to use'
                          : item.key === 'inactive'
                            ? 'Review when needed'
                            : 'Overview ready'}
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
