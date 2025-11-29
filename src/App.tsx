import { ThemeProvider } from '@/components/ThemeProvider';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSideBar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';

export const App = () => {
  return (
    <ThemeProvider defaultTheme="dark">
      <SidebarProvider open={false}>
        <AppSideBar />

        <SidebarInset>
          <Header />
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
};
