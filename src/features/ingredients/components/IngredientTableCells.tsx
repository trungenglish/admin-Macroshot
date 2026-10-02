import { Badge } from '@/components/ui/badge';

export function NutritionValue({
  value,
  unit,
}: {
  value: number;
  unit: 'kcal' | 'g';
}): React.JSX.Element {
  return (
    <span className='tabular-nums'>
      <span className='font-medium'>{value}</span>{' '}
      <span className='text-muted-foreground'>{unit} / 100g</span>
    </span>
  );
}

export function RecipeUsage({
  count,
}: {
  count: number | null;
}): React.JSX.Element {
  if (count === null) return <Badge variant='outline'>Unknown</Badge>;
  if (count === 0) return <Badge variant='secondary'>Not used</Badge>;
  return (
    <Badge>
      {count} {count === 1 ? 'recipe' : 'recipes'}
    </Badge>
  );
}
