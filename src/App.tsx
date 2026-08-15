import { ThemeProvider } from '@/components/ThemeProvider';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSideBar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Page, PageHeader } from '@/components/Page';
import { DashboardCard } from '@/components/DashboardCard';
import { AppBarChart } from '@/components/AppBarChart';
import { AppRadialChart } from '@/components/AppRadialChart';
import { TrendingUpIcon } from 'lucide-react';
import { DashBoardTable } from '@/components/DashboardTable';

export const App = () => {
  return (
    <ThemeProvider defaultTheme='dark'>
      <SidebarProvider>
        <AppSideBar />

        <SidebarInset>
          <Header />

          <main>
            <Page>
              <PageHeader />

              <div className='grid gap-6 py-8 lg:grid-cols-[1fr_360px]'>
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
                  <div className='flex justify-between items-start'>
                    <AppRadialChart />
                    <div className='flex items-center gap-2'>
                      <TrendingUpIcon
                        size={20}
                        className='text-emerald-500 dark:text-emerald-400'
                      />
                      <span className='text-emerald-500 dark:text-emerald-400 font-medium'>
                        10%
                      </span>
                    </div>
                  </div>

                  <div className='mt-6 lg:mt-8'>
                    <p className='font-medium'>
                      You've almost reached your limit
                    </p>

                    <p className='text-muted-foreground'>
                      You have used 80% of your available spots. Upgrade plan to
                      monitor more vendors.
                    </p>
                  </div>
                </DashboardCard>
              </div>

              <DashBoardTable>
                
              </DashBoardTable>
            </Page>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
};
