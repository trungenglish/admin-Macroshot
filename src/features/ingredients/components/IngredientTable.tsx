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
import type { Ingredient } from '../ingredient.types';

interface Props {
  data: Ingredient[];
  total: number;
  page: number;
  pageSize: number;
  columns: ColumnDef<Ingredient>[];
  onPageChange(page: number): void;
  onPageSizeChange(pageSize: number): void;
}

export function IngredientTable({
  data,
  total,
  page,
  pageSize,
  columns,
  onPageChange,
  onPageSizeChange,
}: Props): React.JSX.Element {
  // TanStack owns a mutable table instance, as in the Nutrients table.
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
      <Table
        aria-label='Ingredients'
        className='min-w-max'
      >
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead
                  key={header.id}
                  scope='col'
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
              <TableCell colSpan={columns.length}>
                No ingredients on this page.
              </TableCell>
            </TableRow>
          )}
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <Field
          orientation='horizontal'
          className='w-auto'
        >
          <FieldLabel htmlFor='ingredient-page-size'>Rows per page</FieldLabel>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger id='ingredient-page-size'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {[10, 25, 50].map((size) => (
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
          className='mx-0 w-auto'
          aria-label='Ingredient pagination'
        >
          <PaginationContent>
            <PaginationItem>
              <Button
                variant='outline'
                size='sm'
                disabled={!table.getCanPreviousPage()}
                onClick={() => onPageChange(page - 1)}
              >
                Previous
              </Button>
            </PaginationItem>
            <PaginationItem>
              <span className='px-3 text-sm'>
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
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
