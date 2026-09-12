import { Logo } from '@/assets/Logo';

export function AdminSignInBrand() {
  return (
    <div
      aria-label='NutriPal Admin'
      className='flex items-center justify-center gap-3'
    >
      <span
        aria-hidden='true'
        className='bg-primary/10 text-primary ring-primary/20 flex size-12 items-center justify-center rounded-2xl ring-1'
      >
        <Logo
          color='currentColor'
          size={24}
          variant='icon'
        />
      </span>
      <span className='text-xl font-semibold tracking-tight'>
        NutriPal Admin
      </span>
    </div>
  );
}
