import { ThemeProvider } from '@/components/ThemeProvider';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSideBar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page, PageHeader } from '@/components/Page';
import { DashboardCard } from '@/components/DashboardCard';

export const App = () => {
  return (
    <ThemeProvider defaultTheme="dark">
      <SidebarProvider open={false}>
        <AppSideBar />

        <SidebarInset>
          <Header />

          <main>
            <Page>
              <PageHeader/>

              <div className=''>
                <DashboardCard >
                  
                </DashboardCard>
              </div>
            </Page>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
};
