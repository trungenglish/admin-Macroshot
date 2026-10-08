import { useTheme } from '@/shared/theme/theme-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';

type ThemeToggleProps = {
  variant?: 'icon' | 'sidebar';
};

export const ThemeToggle = ({ variant = 'icon' }: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme();
  const themeIcon = (
    <span className='relative size-4 shrink-0'>
      <SunIcon className='absolute inset-0 size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
      <MoonIcon className='absolute inset-0 size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
    </span>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'sidebar' ? (
          <SidebarMenuButton
            tooltip='Appearance'
            aria-label='Appearance'
          >
            {themeIcon}
            <span>Appearance</span>
          </SidebarMenuButton>
        ) : (
          <Button
            variant='ghost'
            size='icon'
            aria-label='Toggle theme'
          >
            {themeIcon}
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={variant === 'sidebar' ? 'right' : 'bottom'}
        align='end'
        className='w-40'
      >
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <SunIcon />

          <span>Light</span>

          {theme === 'light' && <CheckIcon className='ms-auto' />}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <MoonIcon />

          <span>Dark</span>

          {theme === 'dark' && <CheckIcon className='ms-auto' />}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setTheme('system')}>
          <MonitorIcon />

          <span>System</span>

          {theme === 'system' && <CheckIcon className='ms-auto' />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
