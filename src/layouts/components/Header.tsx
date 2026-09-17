import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { Logo } from '@/assets/Logo';
import { MenuIcon } from 'lucide-react';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';

export const Header = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <header className='flex gap-1 justify-between items-center py-3 ps-4 pe-2 border-b lg:hidden'>
      <Logo />

      <div className='ml-auto'>
        <ThemeToggle /> 
      </div>

      <Button
        variant='ghost'
        size='icon'
        onClick={toggleSidebar}
        aria-label='Toggle mobile menu'
      >
        <MenuIcon />
      </Button>
    </header>
  );
};
