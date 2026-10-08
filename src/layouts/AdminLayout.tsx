import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAppSelector } from '@/app/store-hooks';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { selectAccessToken } from '@/features/auth/store/auth-slice';
import { AppSideBar } from '@/layouts/components/AppSidebar';
import { Header } from '@/layouts/components/Header';

export function AdminLayout() {
  const accessToken = useAppSelector(selectAccessToken);
  const location = useLocation();

  if (!accessToken)
    return (
      <Navigate
        to='/login'
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );

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
