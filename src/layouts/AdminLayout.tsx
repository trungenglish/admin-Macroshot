import { Outlet } from 'react-router-dom';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSideBar } from '@/layouts/components/AppSidebar';
import { Header } from '@/layouts/components/Header';

export function AdminLayout() {
  return (
    <SidebarProvider>
      <AppSideBar />
      <SidebarInset className='min-w-0'>
        <Header />
        <main className='min-w-0 flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8'>
          <div className='mx-auto w-full max-w-[1600px]'>
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
