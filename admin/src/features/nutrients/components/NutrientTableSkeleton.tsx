import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const headings = ['ID', 'Name', 'Unit', 'Ingredients', 'Actions'];

export function NutrientTableSkeleton() {
  return (
    <div
      role='status'
      aria-label='Loading nutrients'
    >
      <span className='sr-only'>Loading nutrients…</span>
      <div className='overflow-hidden rounded-lg border'>
        <Table
          aria-label='Loading nutrients'
          className='min-w-[48rem]'
        >
          <TableHeader className='bg-muted/50'>
            <TableRow>
              {headings.map((heading) => (
                <TableHead
                  scope='col'
                  key={heading}
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
