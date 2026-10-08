import type { User } from '../user.types';

export function UserAvatar({ user }: { user: User }) {
  const fallback = (user.fullName || user.username).trim().charAt(0).toUpperCase();
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=''
        className='size-9 shrink-0 rounded-full border object-cover'
      />
    );
  }
  return (
    <span className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold'>
      {fallback}
    </span>
  );
}
