import { EyeIcon, MoreHorizontalIcon, SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetUsersQuery, type UsersApiError } from '../api/users-api';
import { UserAvatar } from '../components/UserAvatar';
import { UserDetailsDialog } from '../components/UserDetailsDialog';
import { parseUserSearchParams, writeUserSearchParams } from '../user-query';
import type { User } from '../user.types';

const genderLabel: Record<string, string> = { male: 'Male', female: 'Female', other: 'Other' };

function Actions({ user, onView }: { user: User; onView(user: User): void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' aria-label={`Actions for ${user.fullName || user.username}`}>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          onSelect={() => requestAnimationFrame(() => onView(user))}
        >
          <EyeIcon />View details
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UsersPage() {
  const [params, setParams] = useSearchParams();
  const query = parseUserSearchParams(params);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetUsersQuery(query);
  const [selected, setSelected] = useState<User | null>(null);
  const [mobileLayout, setMobileLayout] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640,
  );
  useEffect(() => {
    const updateLayout = () => setMobileLayout(window.innerWidth < 640);
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);
  const change = (changes: Partial<typeof query>) =>
    setParams(writeUserSearchParams({ ...query, ...changes }));
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / query.pageSize));

  return (
    <div className='flex min-w-0 flex-col gap-5'>
      <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink asChild><Link to='/admin'>Admin</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Users</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
      <header className='border-b pb-5'>
        <div className='flex items-center gap-3'><h1 className='text-2xl font-semibold tracking-tight'>Users</h1>{data && <Badge variant='secondary'>{data.total} users</Badge>}</div>
        <p className='mt-1.5 text-sm text-muted-foreground'>Review accounts, roles, and initial setup progress.</p>
      </header>
      <Card className='min-w-0 gap-0 overflow-hidden py-0 shadow-none'>
        <CardContent className='flex min-w-0 flex-col gap-4 p-4 sm:p-5'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
            <label className='flex w-full max-w-xl flex-col gap-2 text-sm font-medium'>Search
              <div className='relative'><SearchIcon className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' /><Input type='search' className='bg-background pl-9' placeholder='Search by name, username, or email…' value={params.get('search') ?? ''} onChange={(event) => change({ search: event.target.value, page: 1 })} /></div>
            </label>
            {data && <span className='text-sm text-muted-foreground'>{data.total} matching</span>}
          </div>
          {isError && <Alert variant='destructive'><AlertTitle>Unable to load users</AlertTitle><AlertDescription>{(error as UsersApiError)?.message}<Button variant='outline' onClick={() => void refetch()}>Retry</Button></AlertDescription></Alert>}
          {isLoading ? <div role='status' className='grid gap-3'><span className='sr-only'>Loading users</span>{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className='h-14 w-full' />)}</div> : data && data.items.length === 0 ? <div className='rounded-lg border px-6 py-16 text-center'><h2 className='font-semibold'>No users found</h2><p className='mt-1 text-sm text-muted-foreground'>Try another search term.</p></div> : data && <>
            {isFetching && <p role='status' className='text-sm text-muted-foreground'>Refreshing users…</p>}
            {!mobileLayout ? <div className='overflow-x-auto rounded-lg border'>
              <Table aria-label='Users' className='min-w-[72rem]'>
                <TableHeader className='bg-muted/35'><TableRow>{['User','Email','Gender','Role','Initial setup','Joined','Actions'].map((label) => <TableHead key={label} className='px-3 text-xs uppercase tracking-wide'>{label}</TableHead>)}</TableRow></TableHeader>
                <TableBody>{data.items.map((user) => <TableRow key={user.id}>
                  <TableCell className='px-3'><div className='flex min-w-0 items-center gap-3'><UserAvatar user={user} /><div className='min-w-0'><div className='max-w-56 truncate font-medium' title={user.fullName}>{user.fullName || user.username}</div><div className='text-xs text-muted-foreground'>@{user.username}</div></div></div></TableCell>
                  <TableCell className='px-3'>{user.email}</TableCell><TableCell className='px-3'>{genderLabel[user.gender] ?? user.gender}</TableCell><TableCell className='px-3'><Badge variant='outline' className='capitalize'>{user.role}</Badge></TableCell>
                  <TableCell className='px-3'><Badge className={user.isNewUser ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'}>{user.isNewUser ? 'Not completed' : 'Completed'}</Badge></TableCell>
                  <TableCell className='px-3'>{new Date(user.createdAt).toLocaleDateString('en-GB')}</TableCell><TableCell className='px-3 text-right'><Actions user={user} onView={setSelected} /></TableCell>
                </TableRow>)}</TableBody>
              </Table>
            </div> :
            <div className='grid gap-3'>{data.items.map((user) => <article key={user.id} className='rounded-lg border bg-card p-4'><div className='flex items-start justify-between gap-3'><div className='flex min-w-0 items-center gap-3'><UserAvatar user={user} /><div className='min-w-0'><h2 className='truncate font-medium'>{user.fullName || user.username}</h2><p className='truncate text-sm text-muted-foreground'>{user.email}</p></div></div><Actions user={user} onView={setSelected} /></div><div className='mt-3 flex flex-wrap gap-2'><Badge variant='outline'>{genderLabel[user.gender] ?? user.gender}</Badge><Badge variant='outline' className='capitalize'>{user.role}</Badge><Badge className={user.isNewUser ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}>{user.isNewUser ? 'Not completed' : 'Completed'}</Badge></div><p className='mt-3 text-xs text-muted-foreground'>Joined {new Date(user.createdAt).toLocaleDateString('en-GB')}</p></article>)}</div>}
            <div className='flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between'><span className='text-sm text-muted-foreground'>Page {query.page} of {pages}</span><div className='flex gap-2'><Button variant='outline' size='sm' disabled={query.page <= 1} onClick={() => change({ page: query.page - 1 })}>Previous</Button><Button variant='outline' size='sm' disabled={query.page >= pages} onClick={() => change({ page: query.page + 1 })}>Next</Button></div></div>
          </>}
        </CardContent>
      </Card>
      <UserDetailsDialog user={selected} open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }} />
    </div>
  );
}
