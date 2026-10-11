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
  'Recipe',
  'Calories / 100 g',
  'Protein',
  'Carbs',
  'Fat',
  'Status',
  'Details',
];

export function RecipeTableSkeleton(): React.JSX.Element {
  return (
    <div
      role='status'
      aria-label='Loading recipes'
    >
      <span className='sr-only'>Loading recipes</span>
      <div className='hidden overflow-hidden rounded-lg border xl:block'>
        <Table
          aria-hidden='true'
          className='min-w-[880px]'
        >
          <TableHeader className='bg-muted/40'>
            <TableRow>
              {headings.map((heading) => (
                <TableHead
                  key={heading}
                  scope='col'
                  className='h-12 px-4'
                >
                  {heading}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 4 }, (_, row) => (
              <TableRow key={row}>
                {headings.map((heading, column) => (
                  <TableCell
                    key={heading}
                    className='h-[76px] px-4'
                  >
                    {column === 0 ? (
                      <div className='flex items-center gap-3'>
                        <Skeleton className='size-12 shrink-0 rounded-md' />
                        <div className='flex flex-col gap-2'>
                          <Skeleton className='h-4 w-36' />
                          <Skeleton className='h-3 w-20' />
                        </div>
                      </div>
                    ) : (
                      <Skeleton className='h-4 w-16' />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className='divide-y rounded-lg border xl:hidden'>
        {Array.from({ length: 4 }, (_, row) => (
          <li
            key={row}
            className='flex items-center gap-3 p-4'
          >
            <Skeleton className='size-12 shrink-0 rounded-md' />
            <div className='flex min-w-0 flex-1 flex-col gap-2'>
              <Skeleton className='h-4 w-2/3' />
              <Skeleton className='h-3 w-1/3' />
              <Skeleton className='h-3 w-1/2' />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
