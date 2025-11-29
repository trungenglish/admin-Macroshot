import { cn } from '@/lib/utils';
import Avatar from 'react-avatar';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupContent,
} from '@/components/ui/sidebar';

import { useSidebar } from '@/components/ui/sidebar';

import { LogOutIcon } from 'lucide-react';
import { Logo } from '@/assets/Logo';
import { APP_SIDEBAR } from '@/constants';
import { useEffect } from 'react';
import { Button } from './ui/button';
import { UserMenu } from '@/components/UserMenu';

export const AppSideBar = () => {
  const { isMobile, toggleSidebar } = useSidebar();

  useEffect(() => toggleSidebar(), [toggleSidebar]);

  return (
    <Sidebar
      variant='floating'
      collapsible='icon'
    >
      {/* Sidebar Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Logo variant={isMobile ? 'default' : 'icon'} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Sidebar Content */}
      <SidebarContent>
        {/* Primary Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {APP_SIDEBAR.primaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    asChild
                  >
                    <a href={item.url}>
                      <item.Icon />

                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Secondary Navigation */}
        {isMobile && (
          <SidebarGroup className='mt-auto'>
            <SidebarGroupContent>
              <SidebarMenu>
                {APP_SIDEBAR.secondaryNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      asChild
                    >
                      <a href={item.url}>
                        <item.Icon />

                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className={cn(isMobile && 'border-t')}>
        <SidebarMenu>
          <SidebarMenuItem className={cn(isMobile && 'p-2')}>
            {isMobile ? (
              <div className='flex justify-between items-start gap-2'>
                <div className='grid grid-cols-[max-content_minmax(0,1fr)] items-center gap-2'>
                  <div className='relative'>
                    <Avatar
                      src={APP_SIDEBAR.curProfile.src}
                      size='36px'
                      round='8px'
                    />

                    <div className='absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 dark:bg-emerald-400 ring-sidebar ring-1'></div>
                  </div>

                  <div>
                    <h3 className='text-sm font-semibold'>
                      {APP_SIDEBAR.curProfile.name}
                    </h3>

                    <p className='text-xs text-muted-foreground truncate'>
                      {APP_SIDEBAR.curProfile.email}
                    </p>
                  </div>
                </div>

                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label='Logout'
                >
                  <LogOutIcon />
                </Button>
              </div>
            ) : (
              <UserMenu />
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
