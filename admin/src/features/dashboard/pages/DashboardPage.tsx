import { Link } from 'react-router-dom';
import {
  ActivityIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BookmarkIcon,
  CalendarCheck2Icon,
  CalendarDaysIcon,
  CarrotIcon,
  FlameIcon,
  FlaskConicalIcon,
  SparklesIcon,
  UsersIcon,
} from 'lucide-react';
import { Bar, BarChart, LabelList, XAxis } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Progress } from '@/components/ui/progress';
import {
  DASHBOARD_METRICS,
  FEATURE_SNAPSHOT,
  INGREDIENT_COVERAGE,
  STREAK_SNAPSHOT,
  WEEKLY_FEATURE_ACTIVITY,
} from '@/features/dashboard/dashboard-mock-data';

const featureChartConfig = {
  total: { label: 'Feature interactions', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const metricIcons = {
  users: UsersIcon,
  activity: ActivityIcon,
  calendar: CalendarDaysIcon,
  flame: FlameIcon,
};

const featureIcons = {
  sparkles: SparklesIcon,
  'calendar-check': CalendarCheck2Icon,
  bookmark: BookmarkIcon,
};

function WeeklyTotalLabel({
  x,
  y,
  width,
  value,
}: {
  x?: number;
  y?: number;
  width?: number;
  value?: number;
}) {
  if (x == null || y == null || width == null || value == null) return null;

  return (
    <text
      x={x + width / 2}
      y={y - 8}
      fill='var(--muted-foreground)'
      fontSize={12}
      textAnchor='middle'
    >
      {value}
    </text>
  );
}

function FeatureActivityChart() {
  return (
    <ChartContainer
      config={featureChartConfig}
      className='h-64 w-full aspect-auto sm:h-96 [&_.recharts-surface:focus-visible]:outline [&_.recharts-surface:focus-visible]:outline-2 [&_.recharts-surface:focus-visible]:outline-offset-2 [&_.recharts-surface:focus-visible]:outline-primary'
      aria-label='Weekly total interactions with MacroShot product features'
    >
      <BarChart
        accessibilityLayer
        data={WEEKLY_FEATURE_ACTIVITY}
        margin={{ top: 20, right: 4, bottom: 0, left: 4 }}
      >
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent />}
        />
        <XAxis
          dataKey='week'
          tickLine={false}
          axisLine={{ stroke: 'var(--border)' }}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          tickMargin={10}
          interval='preserveStartEnd'
          minTickGap={16}
        />
        <Bar
          dataKey='total'
          name='Feature interactions'
          fill='var(--color-total)'
          radius={[5, 5, 0, 0]}
          isAnimationActive={false}
        >
          <LabelList
            dataKey='total'
            position='top'
            fill='var(--muted-foreground)'
            fontSize={12}
            content={<WeeklyTotalLabel />}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

function MetricStrip() {
  return (
    <section
      aria-label='MacroShot overview metrics'
      className='grid grid-cols-2 overflow-hidden rounded-xl border bg-card sm:grid-cols-4'
    >
      {DASHBOARD_METRICS.map((metric, index) => {
        const Icon = metricIcons[metric.icon];
        const changeIsPositive = metric.change.startsWith('+');

        return (
          <article
            key={metric.label}
            className={`flex min-w-0 flex-col gap-3 p-4 sm:p-5 ${
              index % 2 === 0 ? 'border-r' : ''
            } ${index < 2 ? 'border-b sm:border-b-0' : ''} ${
              index < 3 ? 'sm:border-r' : 'sm:border-r-0'
            }`}
          >
            <div className='flex items-center justify-between gap-2'>
              <h2 className='text-sm font-medium text-muted-foreground'>
                {metric.label}
              </h2>
              <span className='grid size-8 shrink-0 place-items-center rounded-md bg-primary/8 text-primary'>
                <Icon
                  aria-hidden='true'
                  className='size-4'
                />
              </span>
            </div>
            <p className='text-2xl font-semibold tabular-nums sm:text-2xl'>
              {metric.value}
            </p>
            <div className='flex min-h-5 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs'>
              <span
                className={`inline-flex items-center gap-0.5 font-medium ${
                  changeIsPositive
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {changeIsPositive ? (
                  <ArrowUpRightIcon
                    className='size-3.5'
                    aria-hidden='true'
                  />
                ) : (
                  <ArrowDownRightIcon
                    className='size-3.5'
                    aria-hidden='true'
                  />
                )}
                {metric.change}
              </span>
              <span className='text-muted-foreground'>{metric.comparison}</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function ActivitySnapshot() {
  return (
    <Card className='min-w-0 gap-0 py-4 shadow-none sm:py-5'>
      <CardHeader className='mb-4 flex grid-cols-1 flex-row items-start justify-between gap-3 px-4 py-0 sm:px-5'>
        <div className='min-w-0'>
          <CardTitle className='text-base text-balance'>
            Product pulse
          </CardTitle>
          <p className='mt-1 text-sm text-muted-foreground'>This month</p>
        </div>
      </CardHeader>
      <CardContent className='grid gap-5 px-4 sm:px-5'>
        <div className='grid gap-2'>
          {FEATURE_SNAPSHOT.map((feature) => {
            const Icon = featureIcons[feature.icon];

            return (
              <div
                key={feature.label}
                className='flex items-center justify-between gap-3 py-1'
              >
                <div className='flex min-w-0 items-center gap-2.5'>
                  <Icon
                    aria-hidden='true'
                    className='size-4 shrink-0 text-muted-foreground'
                  />
                  <span className='truncate text-sm'>{feature.label}</span>
                </div>
                <span className='shrink-0 text-sm font-medium tabular-nums'>
                  {feature.value}
                </span>
              </div>
            );
          })}
        </div>
        <div className='border-t pt-4'>
          <div className='mb-3 flex items-center gap-2'>
            <FlameIcon
              className='size-4 text-muted-foreground'
              aria-hidden='true'
            />
            <h3 className='text-sm font-medium'>Streak pulse</h3>
          </div>
          <div className='grid grid-cols-3 gap-2'>
            {STREAK_SNAPSHOT.map((item) => (
              <div
                key={item.label}
                className='min-w-0'
              >
                <p className='truncate text-sm font-semibold tabular-nums'>
                  {item.value}
                </p>
                <p className='mt-1 text-xs leading-4 text-muted-foreground'>
                  {item.label} · users
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CatalogHealth() {
  const completeness = Math.round(
    (INGREDIENT_COVERAGE.complete / INGREDIENT_COVERAGE.total) * 100,
  );
  const missing = INGREDIENT_COVERAGE.total - INGREDIENT_COVERAGE.complete;

  return (
    <Card className='min-w-0 gap-0 py-4 shadow-none sm:py-5'>
      <CardHeader className='mb-4 flex grid-cols-1 flex-row items-start justify-between gap-3 px-4 py-0 sm:px-5'>
        <div className='min-w-0'>
          <CardTitle className='text-base text-balance'>
            Nutrition catalog
          </CardTitle>
          <p className='mt-1 text-sm text-muted-foreground'>
            Ingredient data completeness
          </p>
        </div>
        <CarrotIcon
          className='mt-1 size-4 shrink-0 text-muted-foreground'
          aria-hidden='true'
        />
      </CardHeader>
      <CardContent className='grid gap-4 px-4 sm:px-5'>
        <div>
          <div className='mb-2 flex items-center justify-between gap-3 text-sm'>
            <span className='text-muted-foreground'>
              Nutrition data available
            </span>
            <span className='font-medium tabular-nums'>{completeness}%</span>
          </div>
          <Progress
            value={completeness}
            aria-label={`${completeness}% of ingredients have nutrition data`}
          />
        </div>
        <div className='flex flex-wrap items-center justify-between gap-3 border-t pt-3'>
          <div className='flex items-center gap-2 text-sm'>
            <FlaskConicalIcon
              className='size-4 text-muted-foreground'
              aria-hidden='true'
            />
            <span>{missing} ingredients need nutrition data</span>
          </div>
          <Link
            className='inline-flex min-h-8 items-center text-sm font-medium text-foreground underline-offset-4 hover:underline'
            to='/admin/ingredients'
          >
            Review ingredients
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminShortcuts() {
  return (
    <Card className='min-w-0 gap-0 py-4 shadow-none sm:py-5'>
      <CardHeader className='mb-3 flex grid-cols-1 flex-row items-start justify-between gap-3 px-4 py-0 sm:px-5'>
        <CardTitle className='text-base'>Admin shortcuts</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-2 px-4 sm:px-5'>
        <Button
          asChild
          variant='outline'
          className='justify-start hover:bg-foreground/10'
        >
          <Link to='/admin/users'>
            <UsersIcon aria-hidden='true' />
            Manage users
          </Link>
        </Button>
        <Button
          asChild
          variant='outline'
          className='justify-start hover:bg-foreground/10'
        >
          <Link to='/admin/ingredients'>
            <CarrotIcon aria-hidden='true' />
            Manage ingredients
          </Link>
        </Button>
        <Button
          asChild
          variant='outline'
          className='justify-start hover:bg-foreground/10'
        >
          <Link to='/admin/nutrients'>
            <FlaskConicalIcon aria-hidden='true' />
            Manage nutrients
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  return (
    <div className='flex min-w-0 flex-col gap-5'>
      <header className='flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-xl font-semibold'>Dashboard</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            A snapshot of MacroShot usage and nutrition data.
          </p>
        </div>
        <Badge variant='outline'>Sample data</Badge>
      </header>

      <MetricStrip />

      <section
        aria-label='Product activity and operations'
        className='grid min-w-0 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]'
      >
        <Card className='min-w-0 gap-0 py-4 shadow-none sm:py-5'>
          <CardHeader className='mb-4 flex grid-cols-1 flex-row items-start justify-between gap-3 px-4 py-0 sm:px-5'>
            <div className='min-w-0'>
              <CardTitle className='text-base text-balance'>
                Weekly product activity
              </CardTitle>
              <p className='mt-1 text-sm text-pretty text-muted-foreground'>
                Suggestion use, plans, and saves · last 8 weeks
              </p>
            </div>
          </CardHeader>
          <CardContent className='min-w-0 px-2 sm:px-4'>
            <FeatureActivityChart />
          </CardContent>
        </Card>

        <div className='grid content-start gap-4'>
          <ActivitySnapshot />
          <AdminShortcuts />
        </div>
      </section>

      <CatalogHealth />
    </div>
  );
}
