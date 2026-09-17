import { Outlet } from 'react-router-dom';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSideBar } from '@/layouts/components/AppSidebar';
import { Header } from '@/layouts/components/Header';

export function AdminLayout() {
  return (
    <SidebarProvider>
      <AppSideBar />
      <SidebarInset>
        <Header />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
