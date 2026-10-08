import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { User } from '../user.types';
import { UserAvatar } from './UserAvatar';

const value = (input: string | number | null, suffix = '') =>
  input === null || input === '' ? 'Not provided' : `${input}${suffix}`;

export function UserDetailsDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User | null;
  open: boolean;
  onOpenChange(open: boolean): void;
}) {
  if (!user) return null;
  const rows = [
    ['ID', `#${user.id}`],
    ['Username', user.username],
    ['Date of birth', value(user.dateOfBirth)],
    ['Height', value(user.heightCm, ' cm')],
    ['Weight', value(user.weightKg, ' kg')],
    ['Activity level', value(user.activityLevel?.replaceAll('_', ' ') ?? null)],
    ['Desired weight', value(user.desiredWeightKg, ' kg')],
    ['Goal pace', value(user.goalPaceKgPerWeek, ' kg/week')],
    ['Last updated', new Date(user.updatedAt).toLocaleDateString('en-GB')],
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <div className='flex items-center gap-3 pr-8'>
            <UserAvatar user={user} />
            <div>
              <DialogTitle>{user.fullName || user.username}</DialogTitle>
              <DialogDescription>{user.email}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <dl className='grid overflow-hidden rounded-lg border text-sm sm:grid-cols-2'>
          {rows.map(([label, item]) => (
            <div key={label} className='border-b p-3 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0'>
              <dt className='text-xs text-muted-foreground'>{label}</dt>
              <dd className='mt-1 font-medium capitalize'>{item}</dd>
            </div>
          ))}
        </dl>
        <DialogFooter>
          <DialogClose asChild><Button variant='outline'>Close</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
