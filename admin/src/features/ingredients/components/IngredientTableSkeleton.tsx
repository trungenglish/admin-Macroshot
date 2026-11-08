import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const headings = [
  'ID',
  'Name',
  'Unit',
  'Calories',
  'Protein',
  'Carbs',
  'Fat',
  'Recipe usage',
  'Actions',
];

export function IngredientTableSkeleton(): React.JSX.Element {
  return (
    <div
      role='status'
      aria-label='Loading ingredients'
    >
      <span className='sr-only'>Loading ingredients</span>
      <div className='overflow-hidden rounded-lg border'>
        <Table
          aria-hidden='true'
          className='min-w-[72rem]'
        >
          <TableHeader className='bg-muted/50'>
            <TableRow>
              {headings.map((heading) => (
                <TableHead
                  key={heading}
                  scope='col'
                  className='h-11 px-4'
                >
                  {heading}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }, (_, row) => (
              <TableRow key={row}>
                {headings.map((heading) => (
                  <TableCell
                    key={heading}
                    className='h-14 px-4'
                  >
                    <Skeleton className='h-5 w-24' />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
