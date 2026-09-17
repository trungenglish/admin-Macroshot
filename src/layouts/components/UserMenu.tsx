import Avatar from 'react-avatar';

import { APP_SIDEBAR } from '@/layouts/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { PlusIcon, ChevronsUpDownIcon } from 'lucide-react';
import { SidebarMenuButton } from '@/components/ui/sidebar';

export const UserMenu = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
        >
          <div className='relative shrink-0'>
            <Avatar
              src={APP_SIDEBAR.curProfile.src}
              size='32px'
              round='8px'
            />

            <div className='absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 dark:bg-emerald-400 ring-sidebar ring-1'></div>
          </div>

          <div className='grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden'>
            <span className='truncate font-semibold'>
              {APP_SIDEBAR.curProfile.name}
            </span>
            <span className='truncate text-xs text-muted-foreground'>
              {APP_SIDEBAR.curProfile.email}
            </span>
          </div>
          
          <ChevronsUpDownIcon className='ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden' />
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side='right'
        align='end'
        className='w-60'
      >
        <DropdownMenuGroup>
          {APP_SIDEBAR.userMenu.itemsPrimary.map((item) => (
            <DropdownMenuItem key={item.title}>
              <item.Icon />

              <span>{item.title}</span>

              {item.kbd && (
                <DropdownMenuShortcut>{item.kbd}</DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuRadioGroup
          value={APP_SIDEBAR.curProfile.email}
          className='space-y-1'
        >
          <DropdownMenuLabel>Switch account</DropdownMenuLabel>

          {APP_SIDEBAR.allProfiles.map((profile) => (
            <DropdownMenuRadioItem
              key={profile.email}
              value={profile.email}
              className='data-[state=checked]:bg-secondary'
            >
              <div className='grid grid-cols-[max-content_minmax(0,1fr)] items-center gap-2'>
                <div className='relative'>
                  <Avatar
                    src={profile.src}
                    size='36px'
                    round='8px'
                  />

                  <div className='absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 dark:bg-emerald-400 ring-sidebar ring-1'></div>
                </div>

                <div>
                  <h3 className='text-sm font-semibold'>{profile.name}</h3>

                  <p className='text-xs text-muted-foreground truncate'>
                    {profile.email}
                  </p>
                </div>
              </div>
            </DropdownMenuRadioItem>
          ))}

          <DropdownMenuItem asChild>
            <Button
              variant='outline'
              size='sm'
              className='w-full'
            >
              <PlusIcon className='size-4' />
              <span>Add account</span>
            </Button>
          </DropdownMenuItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {APP_SIDEBAR.userMenu.itemsSecondary.map((item) => (
            <DropdownMenuItem key={item.title}>
              <item.Icon />

              <span>{item.title}</span>

              {item.kbd && (
                <DropdownMenuShortcut>{item.kbd}</DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
