import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { NUTRIENT_PAGE_SIZES, type Nutrient } from '../nutrient.types';

interface NutrientTableProps {
  data: Nutrient[];
  total: number;
  page: number;
  pageSize: number;
  columns: ColumnDef<Nutrient>[];
  onPageChange(page: number): void;
  onPageSizeChange(pageSize: number): void;
}

export function NutrientTable({
  data,
  total,
  page,
  pageSize,
  columns,
  onPageChange,
  onPageSizeChange,
}: NutrientTableProps) {
  const [mobileLayout, setMobileLayout] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640,
  );
  useEffect(() => {
    const updateLayout = () => setMobileLayout(window.innerWidth < 640);
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  // TanStack Table manages a mutable table instance and cannot be React Compiler memoized.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
    state: { pagination: { pageIndex: page - 1, pageSize } },
  });

  return (
    <div className='flex min-w-0 flex-col gap-4'>
      {mobileLayout ? (
        <div className='grid gap-3'>
          {table.getRowModel().rows.map((row) => {
            const cells = Object.fromEntries(
              row.getVisibleCells().map((cell) => [cell.column.id, cell]),
            );
            const render = (id: string) => {
              const cell = cells[id];
              return cell
                ? flexRender(cell.column.columnDef.cell, cell.getContext())
                : null;
            };

            return (
              <article
                key={row.id}
                className='rounded-lg border bg-card p-4'
              >
                <div className='flex min-w-0 items-start justify-between gap-3 border-b pb-3'>
                  <div className='min-w-0'>
                    <div className='truncate'>{render('name')}</div>
                    <div className='mt-1 flex items-center gap-2'>
                      {render('id')}
                      {render('unit')}
                    </div>
                  </div>
                  {render('actions')}
                </div>
                <dl className='grid gap-3 pt-3 text-sm'>
                  <div className='flex items-center justify-between gap-3'>
                    <dt className='text-xs text-muted-foreground'>
                      Ingredients
                    </dt>
                    <dd>{render('ingredientCount')}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      ) : (
        <div className='overflow-x-auto rounded-lg border'>
          <Table
            aria-label='Nutrients'
            className='min-w-[48rem]'
          >
            <TableHeader className='bg-muted/35'>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      scope='col'
                      className={
                        header.column.id === 'id'
                          ? 'sticky left-0 z-20 h-10 bg-muted/35 px-3 text-xs font-medium uppercase tracking-wide'
                          : header.column.id === 'name'
                            ? 'sticky left-12 z-10 h-10 bg-muted/35 px-3 text-xs font-medium uppercase tracking-wide'
                            : 'h-10 px-3 text-xs font-medium uppercase tracking-wide'
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='h-24 px-4 text-center text-muted-foreground'
                  >
                    No nutrients on this page.
                  </TableCell>
                </TableRow>
              )}
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className='hover:bg-transparent'
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === 'id'
                          ? 'sticky left-0 z-20 h-13 bg-card px-3'
                          : cell.column.id === 'name'
                            ? 'sticky left-12 z-10 h-13 bg-card px-3'
                            : 'h-13 px-3'
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className='flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between'>
        <Field
          orientation='horizontal'
          className='w-full sm:w-auto'
        >
          <FieldLabel htmlFor='nutrient-page-size'>Rows per page</FieldLabel>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger
              id='nutrient-page-size'
              className='w-20'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {NUTRIENT_PAGE_SIZES.map((size) => (
                  <SelectItem
                    key={size}
                    value={String(size)}
                  >
                    {size}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Pagination
          className='mx-0 w-full justify-between sm:w-auto'
          aria-label='Nutrient pagination'
        >
          <PaginationContent>
            <PaginationItem>
              <Button
                variant='outline'
                size='sm'
                disabled={!table.getCanPreviousPage()}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeftIcon
                  aria-hidden='true'
                  data-icon='inline-start'
                />
                Previous
              </Button>
            </PaginationItem>
            <PaginationItem>
              <span className='px-3 text-sm tabular-nums'>
                Page {page} of {Math.max(1, table.getPageCount())}
              </span>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant='outline'
                size='sm'
                disabled={!table.getCanNextPage()}
                onClick={() => onPageChange(page + 1)}
              >
                Next
                <ChevronRightIcon
                  aria-hidden='true'
                  data-icon='inline-end'
                />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
