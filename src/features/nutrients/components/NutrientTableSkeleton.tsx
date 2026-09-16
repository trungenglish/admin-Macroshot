import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const headings = ['ID', 'Name', 'Unit', 'Ingredients', 'Status', 'Actions'];

export function NutrientTableSkeleton() {
  return (
    <div
      role='status'
      aria-label='Loading nutrients'
    >
      <span className='sr-only'>Loading nutrients</span>
      <Table
        aria-label='Loading nutrients'
        className='min-w-max'
      >
        <TableHeader>
          <TableRow>
            {headings.map((heading) => (
              <TableHead
                scope='col'
                key={heading}
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
                <TableCell key={heading}>
                  <Skeleton className='h-5 w-24' />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
