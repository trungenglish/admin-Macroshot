import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function NutritionValue({
  value,
  unit,
}: {
  value: number;
  unit: 'kcal' | 'g';
  tone?: 'default' | 'protein' | 'carbs' | 'fat';
}): React.JSX.Element {
  return (
    <span className={cn('inline-flex gap-1 whitespace-nowrap tabular-nums')}>
      <span className='font-medium'>{value}</span>{' '}
      <span className='text-xs text-muted-foreground'>{unit}</span>
    </span>
  );
}

export function RecipeUsage({
  count,
}: {
  count: number | null;
}): React.JSX.Element {
  if (count === null)
    return (
      <Badge
        variant='outline'
        className='text-muted-foreground'
      >
        Unknown
      </Badge>
    );
  if (count === 0) return <Badge variant='secondary'>Not used</Badge>;
  return (
    <Badge variant='secondary'>
      {count} {count === 1 ? 'recipe' : 'recipes'}
    </Badge>
  );
}
