import { ThemeProvider } from '@/components/ThemeProvider';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSideBar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page, PageHeader } from '@/components/Page';
import { DashboardCard } from '@/components/DashboardCard';
import { AppBarChart } from '@/components/AppBarChart';
import { AppRadialChart } from '@/components/AppRadialChart';

export const App = () => {
  return (
    <ThemeProvider defaultTheme='dark'>
      <SidebarProvider open={false}>
        <AppSideBar />

        <SidebarInset>
          <Header />

          <main>
            <Page>
              <PageHeader />

              <div className=''>
                <DashboardCard
                  title='Vendor breakdown'
                  description='keep track of Vendor breakdown and their secutiry ratings'
                  buttonText='View full report'
                >
                  <AppBarChart></AppBarChart>
                </DashboardCard>

                <DashboardCard
                  title='Vendor monitored'
                  description="You're using 80% of available spots."
                  buttonText='Upgrade plan'
                >
                  <AppRadialChart></AppRadialChart>
                </DashboardCard>
              </div>
            </Page>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
};
