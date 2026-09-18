import { useId, useRef, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useGetNutrientsQuery } from '@/features/nutrients/api/nutrients-api';
import type { Nutrient } from '@/features/nutrients/nutrient.types';

export function NutrientPickerDialog({
  open,
  onOpenChange,
  selectedIds,
  onSelect,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  selectedIds: number[];
  onSelect(nutrient: Nutrient): void;
}): React.JSX.Element {
  const id = useId();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const opener = useRef<HTMLElement | null>(null);
  const query = useGetNutrientsQuery(
    { page, pageSize: 10, search, isActive: true },
    { skip: !open },
  );
  const result = query.currentData;
  const items = result?.items.filter(
    (nutrient) => nutrient.isActive && !selectedIds.includes(nutrient.id),
  );
  const pages = Math.max(1, Math.ceil((result?.total ?? 0) / 10));
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        onOpenAutoFocus={() => {
          opener.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
        }}
        onCloseAutoFocus={(event) => {
          if (opener.current?.isConnected) {
            event.preventDefault();
            opener.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Add nutrient</DialogTitle>
          <DialogDescription>
            Search active nutrients and choose one to enter its amount per 100g.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`${id}-search`}>Search nutrients</FieldLabel>
            <Input
              id={`${id}-search`}
              type='search'
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </Field>
        </FieldGroup>
        <section
          aria-label='Nutrient choices'
          aria-busy={query.isFetching}
          className='flex max-h-72 flex-col gap-2 overflow-y-auto'
        >
          {query.isError && (
            <Alert variant='destructive'>
              <AlertDescription>
                {'message' in (query.error ?? {})
                  ? String((query.error as { message: string }).message)
                  : 'Unable to load nutrients.'}
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => void query.refetch()}
                >
                  Retry nutrients
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {!result && !query.isError && (
            <p role='status'>
              <Spinner aria-hidden='true' />
              Loading nutrients
            </p>
          )}
          {result && query.isFetching && (
            <p role='status'>Refreshing nutrients</p>
          )}
          {items?.map((nutrient) => (
            <Button
              key={nutrient.id}
              type='button'
              variant='outline'
              aria-label={`Add ${nutrient.name}`}
              onClick={() => {
                onSelect(nutrient);
                onOpenChange(false);
              }}
            >
              {nutrient.name} ({nutrient.unit})
            </Button>
          ))}
          {items?.length === 0 && (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No available nutrients on this page</EmptyTitle>
                <EmptyDescription>
                  Try another page or search. Selected nutrients are excluded.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </Button>
          <span aria-live='polite'>
            Page {page}
            {result ? ` of ${pages}` : ''}
          </span>
          <Button
            type='button'
            variant='outline'
            disabled={!result || page >= pages || query.isFetching}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
